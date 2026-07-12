import { Router, Response } from "express";
import { and, eq, desc } from "drizzle-orm";
import { asyncHandler } from "../utils/asyncHandler";
import { validateUUIDParam } from "../utils/validateUUID";
import { AuthRequest } from "../middleware/auth.middleware";
import { requireUser } from "../middleware/requireUser";
import { db } from "../db/index";
import { flashcards, files } from "../db/schema";

export const flashcardRouter = Router();

flashcardRouter.get("/file/:fileId", validateUUIDParam("fileId"), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  const { fileId } = req.params;
  const [file] = await db
    .select({ id: files.id })
    .from(files)
    .where(and(eq(files.id, fileId), eq(files.userId, user.id)));
  if (!file) return res.status(404).json({ error: "File not found" });
  const rows = await db
    .select()
    .from(flashcards)
    .where(and(eq(flashcards.fileId, fileId), eq(flashcards.userId, user.id)))
    .orderBy(desc(flashcards.createdAt));
  res.json({ data: rows, message: "Flashcard decks retrieved" });
}));

flashcardRouter.delete("/:id", validateUUIDParam("id"), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  const { id } = req.params;
  const [existing] = await db
    .select()
    .from(flashcards)
    .where(and(eq(flashcards.id, id), eq(flashcards.userId, user.id)));
  if (!existing) return res.status(404).json({ error: "Flashcard deck not found" });
  await db.delete(flashcards).where(and(eq(flashcards.id, id), eq(flashcards.userId, user.id)));
  res.json({ data: null, message: "Flashcard deck deleted" });
}));
