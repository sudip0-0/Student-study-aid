import { Response } from "express";
import { UTApi } from "uploadthing/server";
import { asyncHandler } from "../utils/asyncHandler";
import {
  getFileById,
  getUserFiles,
  createFileRecord,
  updateFile,
  deleteFileRecord,
} from "../services/file.service";
import { assertFolderOwnedByUser } from "../services/folder.service";
import { parseDocxHtml } from "../services/parsing.service";
import { enqueueExtractionJob } from "../services/extractionJob.service";
import { AuthRequest } from "../middleware/auth.middleware";
import { requireUser } from "../middleware/requireUser";
import { logger } from "../lib/logger";

const utapi = new UTApi();

function uploadThingKeyFromUrl(url: string): string | null {
  if (!url) return null;
  const key = url.split("/").pop();
  return key || null;
}

export const listFiles = asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const userId = req.user.id;
  const folderId = req.query.folderId as string | undefined;
  const result = await getUserFiles(userId, folderId);
  res.json({ data: result, message: "Files retrieved" });
});

export const getFile = asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const file = await getFileById(req.params.id as string, req.user.id);
  if (!file) return res.status(404).json({ error: "File not found" });
  res.json({ data: file, message: "File retrieved" });
});

export const getDocxPreview = asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const file = await getFileById(req.params.id as string, req.user.id);
  if (!file) return res.status(404).json({ error: "File not found" });
  if (file.type !== "docx") {
    return res.status(400).json({ error: "Preview is only available for DOCX files" });
  }
  if (!file.url) {
    return res.status(400).json({ error: "File has no downloadable URL" });
  }

  if (file.extractedHtml) {
    return res.json({ data: { html: file.extractedHtml }, message: "DOCX preview retrieved" });
  }

  const html = await parseDocxHtml(file.url);
  if (!html) {
    return res.status(422).json({ error: "Could not render a formatted preview for this document" });
  }

  await updateFile(file.id, req.user.id, {
    extractedHtml: html,
    extractionStatus: "ready",
  });

  res.json({ data: { html }, message: "DOCX preview generated" });
});

export const reparseFile = asyncHandler<AuthRequest>(async (req, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  const file = await getFileById(req.params.id as string, user.id);
  if (!file) return res.status(404).json({ error: "File not found" });
  if (!file.url) {
    return res.status(400).json({ error: "This file cannot be re-parsed" });
  }

  await enqueueExtractionJob(file.id, user.id);

  res.json({
    data: { extractionStatus: "pending" as const },
    message: "Text extraction started",
  });
});

export const patchFile = asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const userId = req.user.id;
  const { name, folderId, extractedText } = req.body;

  const file = await getFileById(req.params.id as string, userId);
  if (!file) return res.status(404).json({ error: "File not found" });

  if (folderId !== undefined && folderId !== null) {
    await assertFolderOwnedByUser(folderId, userId);
  }

  const updated = await updateFile(req.params.id as string, userId, {
    name,
    folderId: folderId !== undefined ? folderId : undefined,
    extractedText,
  });

  res.json({ data: updated, message: "File updated" });
});

export const removeFile = asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const userId = req.user.id;
  const file = await getFileById(req.params.id as string, userId);
  if (!file) return res.status(404).json({ error: "File not found" });

  await deleteFileRecord(req.params.id as string, userId);

  const key = uploadThingKeyFromUrl(file.url);
  if (key) {
    await utapi.deleteFiles(key).catch((err: unknown) => {
      logger.error({ err }, "UploadThing delete failed after DB delete");
    });
  }

  res.json({ message: "File deleted" });
});

export const createBlank = asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { name, folderId } = req.body;

  await assertFolderOwnedByUser(folderId || undefined, req.user.id);

  const file = await createFileRecord({
    name: name.replace(/[^a-zA-Z0-9.\-_ ]/g, "_"),
    type: "txt",
    size: 0,
    url: "",
    userId: req.user.id,
    folderId: folderId || undefined,
    extractionStatus: "ready",
    extractedText: "",
  });

  res.status(201).json({ data: file, message: "Blank file created" });
});
