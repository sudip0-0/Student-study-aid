import { Router } from "express";
import { z } from "zod";
import { listFiles, getFile, getDocxPreview, uploadFile, patchFile, removeFile, createBlank } from "../controllers/file.controller";
import { getNotes, getHighlights } from "./file.routes.helpers";
import { validateUUIDParam } from "../utils/validateUUID";

const uploadSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["pdf", "docx", "txt"]),
  url: z.string().url(),
  size: z.number().min(0).max(20 * 1024 * 1024).optional(),
  folderId: z.string().uuid().nullable().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  folderId: z.string().uuid().nullable().optional(),
  extractedText: z.string().max(500000).optional(),
});

const blankSchema = z.object({
  name: z.string().min(1).max(200),
  folderId: z.string().uuid().nullable().optional(),
});

export const fileRouter = Router();

fileRouter.get("/", listFiles);
fileRouter.get("/:id/docx-preview", validateUUIDParam("id"), getDocxPreview);
fileRouter.get("/:id", validateUUIDParam("id"), getFile);

fileRouter.post("/blank", (req, res, next) => {
  const result = blankSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });
  req.body = result.data;
  next();
}, createBlank);

fileRouter.post("/upload", (req, res, next) => {
  const result = uploadSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });
  req.body = result.data;
  next();
}, uploadFile);

fileRouter.patch("/:id", validateUUIDParam("id"), (req, res, next) => {
  const result = updateSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });
  req.body = result.data;
  next();
}, patchFile);

fileRouter.delete("/:id", validateUUIDParam("id"), removeFile);

fileRouter.get("/:fileId/notes", validateUUIDParam("fileId"), getNotes);
fileRouter.get("/:fileId/highlights", validateUUIDParam("fileId"), getHighlights);
