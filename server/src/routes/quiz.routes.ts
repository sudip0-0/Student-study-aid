import { Router, Response } from "express";
import { and, eq, desc } from "drizzle-orm";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { validateUUIDParam } from "../utils/validateUUID";
import { AuthRequest } from "../middleware/auth.middleware";
import { db } from "../db/index";
import { quizzes, files } from "../db/schema";

export const quizRouter = Router();

const attemptSchema = z.object({
  score: z.number().int().min(0).max(100),
});

quizRouter.get("/", asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const rows = await db
    .select({
      id: quizzes.id,
      userId: quizzes.userId,
      fileId: quizzes.fileId,
      title: quizzes.title,
      questions: quizzes.questions,
      score: quizzes.score,
      attemptedAt: quizzes.attemptedAt,
      createdAt: quizzes.createdAt,
      fileName: files.name,
    })
    .from(quizzes)
    .leftJoin(files, eq(quizzes.fileId, files.id))
    .where(eq(quizzes.userId, req.user.id))
    .orderBy(desc(quizzes.createdAt));
  res.json({ data: rows, message: "Quizzes retrieved" });
}));

quizRouter.get("/file/:fileId", validateUUIDParam("fileId"), asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { fileId } = req.params;
  const [file] = await db
    .select({ id: files.id })
    .from(files)
    .where(and(eq(files.id, fileId), eq(files.userId, req.user.id)));
  if (!file) return res.status(404).json({ error: "File not found" });
  const rows = await db
    .select()
    .from(quizzes)
    .where(and(eq(quizzes.fileId, fileId), eq(quizzes.userId, req.user.id)))
    .orderBy(desc(quizzes.createdAt));
  res.json({ data: rows, message: "Quizzes retrieved" });
}));

quizRouter.patch("/:id/attempt", validateUUIDParam("id"), asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { id } = req.params;
  const result = attemptSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });
  const { score } = result.data;
  const [existing] = await db
    .select()
    .from(quizzes)
    .where(and(eq(quizzes.id, id), eq(quizzes.userId, req.user.id)));
  if (!existing) return res.status(404).json({ error: "Quiz not found" });
  const [updated] = await db
    .update(quizzes)
    .set({ score, attemptedAt: new Date() })
    .where(and(eq(quizzes.id, id), eq(quizzes.userId, req.user.id)))
    .returning();
  res.json({ data: updated, message: "Quiz attempt saved" });
}));

quizRouter.delete("/:id", validateUUIDParam("id"), asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { id } = req.params;
  const [existing] = await db
    .select()
    .from(quizzes)
    .where(and(eq(quizzes.id, id), eq(quizzes.userId, req.user.id)));
  if (!existing) return res.status(404).json({ error: "Quiz not found" });
  await db.delete(quizzes).where(and(eq(quizzes.id, id), eq(quizzes.userId, req.user.id)));
  res.json({ data: null, message: "Quiz deleted" });
}));
