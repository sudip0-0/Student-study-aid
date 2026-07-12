import { and, eq, lte, asc, inArray } from "drizzle-orm";
import { db } from "../db/index";
import { extractionJobs, files } from "../db/schema";
import { runFileExtraction } from "./extraction.service";
import { acquireLock, releaseLock } from "../lib/redis";
import { logger } from "../lib/logger";

const MAX_ATTEMPTS = 5;
const LOCK_TTL_SECONDS = 120;

export async function enqueueExtractionJob(fileId: string, userId: string): Promise<void> {
  await db.insert(extractionJobs).values({
    fileId,
    userId,
    status: "pending",
    attempts: 0,
    nextRunAt: new Date(),
  });

  await db
    .update(files)
    .set({ extractionStatus: "pending" })
    .where(and(eq(files.id, fileId), eq(files.userId, userId)));
}

async function claimJobs(limit = 5) {
  const now = new Date();
  const candidates = await db
    .select()
    .from(extractionJobs)
    .where(
      and(
        inArray(extractionJobs.status, ["pending", "failed"]),
        lte(extractionJobs.nextRunAt, now)
      )
    )
    .orderBy(asc(extractionJobs.nextRunAt))
    .limit(limit);

  return candidates.filter((j) => j.attempts < MAX_ATTEMPTS || j.status === "pending");
}

export async function processExtractionJobsOnce(): Promise<number> {
  const jobs = await claimJobs();
  let processed = 0;

  for (const job of jobs) {
    const lockKey = `lumio:extract:${job.id}`;
    const locked = await acquireLock(lockKey, LOCK_TTL_SECONDS);
    if (!locked) continue;

    try {
      await db
        .update(extractionJobs)
        .set({ status: "processing", updatedAt: new Date() })
        .where(eq(extractionJobs.id, job.id));

      const [file] = await db
        .select({ id: files.id, type: files.type, url: files.url, userId: files.userId })
        .from(files)
        .where(and(eq(files.id, job.fileId), eq(files.userId, job.userId)));

      if (!file) {
        await db
          .update(extractionJobs)
          .set({ status: "failed", lastError: "File missing", updatedAt: new Date() })
          .where(eq(extractionJobs.id, job.id));
        continue;
      }

      await runFileExtraction(file.id, file.userId, file.type, file.url);

      const [updated] = await db
        .select({ extractionStatus: files.extractionStatus })
        .from(files)
        .where(eq(files.id, file.id));

      if (updated?.extractionStatus === "ready") {
        await db
          .update(extractionJobs)
          .set({ status: "completed", updatedAt: new Date(), lastError: null })
          .where(eq(extractionJobs.id, job.id));
      } else {
        const attempts = job.attempts + 1;
        const backoffMs = Math.min(60_000, 2 ** attempts * 1000);
        await db
          .update(extractionJobs)
          .set({
            status: attempts >= MAX_ATTEMPTS ? "failed" : "pending",
            attempts,
            nextRunAt: new Date(Date.now() + backoffMs),
            lastError: "Extraction did not produce text",
            updatedAt: new Date(),
          })
          .where(eq(extractionJobs.id, job.id));
      }
      processed += 1;
    } catch (err) {
      const attempts = job.attempts + 1;
      const backoffMs = Math.min(60_000, 2 ** attempts * 1000);
      logger.error({ err, jobId: job.id }, "Extraction job failed");
      await db
        .update(extractionJobs)
        .set({
          status: attempts >= MAX_ATTEMPTS ? "failed" : "pending",
          attempts,
          nextRunAt: new Date(Date.now() + backoffMs),
          lastError: err instanceof Error ? err.message : "Unknown error",
          updatedAt: new Date(),
        })
        .where(eq(extractionJobs.id, job.id));
    } finally {
      await releaseLock(lockKey);
    }
  }

  return processed;
}

let workerTimer: ReturnType<typeof setInterval> | null = null;

export function startExtractionWorker(intervalMs = 5000): void {
  if (workerTimer) return;
  workerTimer = setInterval(() => {
    void processExtractionJobsOnce().catch((err) => {
      logger.error({ err }, "Extraction worker tick failed");
    });
  }, intervalMs);
  // Allow process to exit in tests
  if (typeof workerTimer === "object" && "unref" in workerTimer) {
    workerTimer.unref();
  }
}
