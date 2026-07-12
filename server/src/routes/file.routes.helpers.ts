import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { getFileById } from "../services/file.service";
import { getNotesByFileId } from "../services/note.service";
import { getHighlightsByFileId } from "../services/highlight.service";
import { AuthRequest } from "../middleware/auth.middleware";
import { requireUser } from "../middleware/requireUser";

export const getNotes = asyncHandler<AuthRequest>(async (req, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  const fileId = req.params.fileId as string;
  const file = await getFileById(fileId, user.id);
  if (!file) return res.status(404).json({ error: "File not found" });
  const notes = await getNotesByFileId(fileId, user.id);
  res.json({ data: notes, message: "Notes retrieved" });
});

export const getHighlights = asyncHandler<AuthRequest>(async (req, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  const fileId = req.params.fileId as string;
  const file = await getFileById(fileId, user.id);
  if (!file) return res.status(404).json({ error: "File not found" });
  const highlights = await getHighlightsByFileId(fileId, user.id);
  res.json({ data: highlights, message: "Highlights retrieved" });
});
