import { Router } from "express";
import { z } from "zod";
import { listFiles, getFile, getDocxPreview, reparseFile, patchFile, removeFile, createBlank } from "../controllers/file.controller";
import { getNotes, getHighlights } from "./file.routes.helpers";
import { validateUUIDParam } from "../utils/validateUUID";
import { validateBody } from "../middleware/validate";

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
fileRouter.post("/:id/reparse", validateUUIDParam("id"), reparseFile);
fileRouter.get("/:id", validateUUIDParam("id"), getFile);

fileRouter.post("/blank", validateBody(blankSchema), createBlank);

fileRouter.patch("/:id", validateUUIDParam("id"), validateBody(updateSchema), patchFile);

fileRouter.delete("/:id", validateUUIDParam("id"), removeFile);

fileRouter.get("/:fileId/notes", validateUUIDParam("fileId"), getNotes);
fileRouter.get("/:fileId/highlights", validateUUIDParam("fileId"), getHighlights);
