import { Router, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { validateUUIDParam } from "../utils/validateUUID";
import { validateBody } from "../middleware/validate";
import {
  getFileById,
  getNotesByFileId,
  createNote,
  updateNote,
  deleteNote,
} from "../services/file.service";
import { AuthRequest } from "../middleware/auth.middleware";
import { requireUser } from "../middleware/requireUser";

const createSchema = z.object({
  fileId: z.string().uuid(),
  content: z.string().min(1).max(100000),
});

const updateSchema = z.object({
  content: z.string().min(1).max(100000),
});

export const noteRouter = Router();

noteRouter.get("/:fileId", validateUUIDParam("fileId"), asyncHandler<AuthRequest>(async (req, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  const file = await getFileById(req.params.fileId as string, user.id);
  if (!file) return res.status(404).json({ error: "File not found" });
  const notes = await getNotesByFileId(file.id, user.id);
  res.json({ data: notes, message: "Notes retrieved" });
}));

noteRouter.post("/", validateBody(createSchema), asyncHandler<AuthRequest>(async (req, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  const note = await createNote({ ...req.body, userId: user.id });
  if (!note) return res.status(404).json({ error: "File not found" });
  res.status(201).json({ data: note, message: "Note created" });
}));

noteRouter.patch("/:id", validateUUIDParam("id"), validateBody(updateSchema), asyncHandler<AuthRequest>(async (req, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  const note = await updateNote(req.params.id as string, user.id, req.body);
  if (!note) return res.status(404).json({ error: "Note not found" });
  res.json({ data: note, message: "Note updated" });
}));

noteRouter.delete("/:id", validateUUIDParam("id"), asyncHandler<AuthRequest>(async (req, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  const note = await deleteNote(req.params.id as string, user.id);
  if (!note) return res.status(404).json({ error: "Note not found" });
  res.json({ data: note, message: "Note deleted" });
}));
