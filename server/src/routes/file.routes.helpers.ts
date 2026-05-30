import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { getFileById, getNotesByFileId, getHighlightsByFileId } from "../services/file.service";
import { AuthRequest } from "../middleware/auth.middleware";

export const getNotes = asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const fileId = req.params.fileId as string;
  const file = await getFileById(fileId, req.user.id);
  if (!file) return res.status(404).json({ error: "File not found" });
  const notes = await getNotesByFileId(fileId, req.user.id);
  res.json({ data: notes, message: "Notes retrieved" });
});

export const getHighlights = asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const fileId = req.params.fileId as string;
  const file = await getFileById(fileId, req.user.id);
  if (!file) return res.status(404).json({ error: "File not found" });
  const highlights = await getHighlightsByFileId(fileId, req.user.id);
  res.json({ data: highlights, message: "Highlights retrieved" });
});
