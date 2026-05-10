import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { getNotesByFileId, getHighlightsByFileId } from "../services/file.service";
import { AuthRequest } from "../middleware/auth.middleware";

export const getNotes = asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const notes = await getNotesByFileId(req.params.fileId as string, req.user.id);
  res.json({ data: notes, message: "Notes retrieved" });
});

export const getHighlights = asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const highlights = await getHighlightsByFileId(req.params.fileId as string, req.user.id);
  res.json({ data: highlights, message: "Highlights retrieved" });
});
