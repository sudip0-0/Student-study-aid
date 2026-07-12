import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db/index";
import { authRouter } from "./routes/auth.routes";
import { fileRouter } from "./routes/file.routes";
import { folderRouter } from "./routes/folder.routes";
import { highlightRouter } from "./routes/highlight.routes";
import { noteRouter } from "./routes/note.routes";
import { aiRouter } from "./routes/ai.routes";
import { quizRouter } from "./routes/quiz.routes";
import { flashcardRouter } from "./routes/flashcard.routes";
import { searchRouter } from "./routes/search.routes";
import { uploadRouter } from "./routes/upload.routes";
import { cheatsheetRouter } from "./routes/cheatsheet.routes";
import { chatRouter } from "./routes/chat.routes";
import { authMiddleware } from "./middleware/auth.middleware";
import { errorMiddleware } from "./middleware/error.middleware";
import { rateLimitMiddleware } from "./middleware/rateLimit";
import { requestIdMiddleware } from "./middleware/requestId";
import { metricsMiddleware } from "./middleware/metricsMiddleware";
import { initRedis, pingRedis } from "./lib/redis";
import { logger } from "./lib/logger";
import { snapshot } from "./lib/metrics";
import { startExtractionWorker } from "./services/extractionJob.service";
import { recordHttpError } from "./middleware/metricsMiddleware";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  ENCRYPTION_KEY: z.string().length(64),
  UPLOADTHING_SECRET: z.string().min(1),
  UPLOAD_CALLBACK_SECRET: z.string().min(1).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  CLIENT_URL: z.string().url().optional(),
  CORS_ORIGINS: z.string().optional(),
  APP_URL: z.string().url().optional(),
  PORT: z.coerce.number().int().positive().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),
});

const envResult = envSchema.safeParse(process.env);
if (!envResult.success) {
  console.error("Missing or invalid environment variables:", envResult.error.format());
  process.exit(1);
}

if (envResult.data.NODE_ENV === "production") {
  if (!envResult.data.UPSTASH_REDIS_REST_URL || !envResult.data.UPSTASH_REDIS_REST_TOKEN) {
    console.error("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production");
    process.exit(1);
  }
}

initRedis();

function resolveCorsOrigins(): string[] {
  const fromList = process.env.CORS_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean) ?? [];
  const clientUrl = process.env.CLIENT_URL?.trim();
  const defaults = ["http://localhost:5173"];
  const merged = [...fromList, ...(clientUrl ? [clientUrl] : []), ...defaults];
  return [...new Set(merged)];
}

const corsOrigins = resolveCorsOrigins();
const app = express();
const PORT = envResult.data.PORT ?? 3001;
const startedAt = Date.now();
const isProd = process.env.NODE_ENV === "production";

app.use(requestIdMiddleware);
app.use(metricsMiddleware);
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "no-referrer" },
    frameguard: { action: "deny" },
    hsts: isProd ? { maxAge: 15552000, includeSubDomains: true } : false,
  })
);
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.requestId || "unknown",
    customSuccessMessage: (req, res) => {
      if (res.statusCode >= 400) recordHttpError();
      return `${req.method} ${req.url} ${res.statusCode}`;
    },
  })
);

app.use((req, res, next) => {
  const isProdEnv = process.env.NODE_ENV === "production";
  const origin = req.headers.origin;
  if (!origin) {
    if (isProdEnv && req.path !== "/api/health" && req.path !== "/api/metrics") {
      res.status(403).json({ error: "Origin required" });
      return;
    }
    next();
    return;
  }
  if (!corsOrigins.includes(origin)) {
    res.status(403).json({ error: "Not allowed by CORS" });
    return;
  }
  next();
});

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        // Missing Origin already gated above (prod allows only health/metrics)
        callback(null, true);
        return;
      }
      if (corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", rateLimitMiddleware("auth"), authRouter);
app.use("/api/files", authMiddleware, fileRouter);
app.use("/api/folders", authMiddleware, folderRouter);
app.use("/api/highlights", authMiddleware, highlightRouter);
app.use("/api/notes", authMiddleware, noteRouter);
app.use("/api/upload", rateLimitMiddleware("upload"), express.json({ limit: "50mb" }), uploadRouter);
app.use("/api/ai", authMiddleware, rateLimitMiddleware("ai"), aiRouter);
app.use("/api/quizzes", authMiddleware, quizRouter);
app.use("/api/flashcards", authMiddleware, flashcardRouter);
app.use("/api/cheatsheets", authMiddleware, cheatsheetRouter);
app.use("/api/chat", authMiddleware, chatRouter);
app.use("/api/search", authMiddleware, searchRouter);

app.get("/api/metrics", (_req, res) => {
  res.json({ data: snapshot(), message: "Metrics snapshot" });
});

app.get("/api/health", async (_req, res) => {
  try {
    await db.execute(sql`select 1`);
    const redis = await pingRedis();
    const metrics = snapshot();
    const healthy = redis === "connected" || redis === "not_configured";
    res.status(healthy ? 200 : 503).json({
      data: {
        status: healthy ? "ok" : "degraded",
        database: "connected",
        redis,
        uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
        environment: process.env.NODE_ENV ?? "development",
        metricsSample: {
          extractionCompleted: metrics.extraction_jobs_completed,
          errors: metrics.http_errors_total,
        },
      },
      message: healthy ? "Service healthy" : "Redis unavailable",
    });
  } catch {
    res.status(503).json({ error: "Database unavailable" });
  }
});

app.use(errorMiddleware);

if (process.env.NODE_ENV !== "test") {
  startExtractionWorker();
  app.listen(PORT, () => logger.info({ port: PORT }, "Server running"));
}

export { app };
