import { Router, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { validateUUIDParam } from "../utils/validateUUID";
import { AuthRequest } from "../middleware/auth.middleware";
import { requireUser } from "../middleware/requireUser";
import {
  listUserQuizzes,
  listQuizzesForFile,
  saveQuizAttempt,
  deleteQuiz,
} from "../services/quiz.service";

export const quizRouter = Router();

const attemptSchema = z.object({
  score: z.number().int().min(0).max(100),
});

quizRouter.get("/", asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  const rows = await listUserQuizzes(user.id);
  res.json({ data: rows, message: "Quizzes retrieved" });
}));

quizRouter.get("/file/:fileId", validateUUIDParam("fileId"), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  const rows = await listQuizzesForFile(req.params.fileId as string, user.id);
  if (!rows) return res.status(404).json({ error: "File not found" });
  res.json({ data: rows, message: "Quizzes retrieved" });
}));

quizRouter.patch("/:id/attempt", validateUUIDParam("id"), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  const result = attemptSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });
  const updated = await saveQuizAttempt(req.params.id as string, user.id, result.data.score);
  if (!updated) return res.status(404).json({ error: "Quiz not found" });
  res.json({ data: updated, message: "Quiz attempt saved" });
}));

quizRouter.delete("/:id", validateUUIDParam("id"), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  const ok = await deleteQuiz(req.params.id as string, user.id);
  if (!ok) return res.status(404).json({ error: "Quiz not found" });
  res.json({ data: null, message: "Quiz deleted" });
}));
