import { Router, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { validateUUIDParam } from "../utils/validateUUID";
import {
  getFileById,
  getNotesByFileId,
  createNote,
  updateNote,
  deleteNote,
} from "../services/file.service";
import { AuthRequest } from "../middleware/auth.middleware";

const createSchema = z.object({
  fileId: z.string().uuid(),
  content: z.string().min(1).max(100000),
});

const updateSchema = z.object({
  content: z.string().min(1).max(100000),
});

export const noteRouter = Router();

noteRouter.get("/:fileId", validateUUIDParam("fileId"), asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const userId = req.user.id;
  const file = await getFileById(req.params.fileId as string, userId);
  if (!file) return res.status(404).json({ error: "File not found" });
  const notes = await getNotesByFileId(file.id, userId);
  res.json({ data: notes, message: "Notes retrieved" });
}));

noteRouter.post("/", asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const result = createSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });
  const userId = req.user.id;
  const note = await createNote({ ...result.data, userId });
  if (!note) return res.status(404).json({ error: "File not found" });
  res.status(201).json({ data: note, message: "Note created" });
}));

noteRouter.patch("/:id", validateUUIDParam("id"), asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const result = updateSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });
  const userId = req.user.id;
  const note = await updateNote(req.params.id as string, userId, result.data);
  if (!note) return res.status(404).json({ error: "Note not found" });
  res.json({ data: note, message: "Note updated" });
}));

noteRouter.delete("/:id", validateUUIDParam("id"), asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const userId = req.user.id;
  const note = await deleteNote(req.params.id as string, userId);
  if (!note) return res.status(404).json({ error: "Note not found" });
  res.json({ message: "Note deleted" });
}));
