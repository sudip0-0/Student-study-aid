import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import {
  getFileById,
  getUserFiles,
  createFileRecord,
  updateFile,
  deleteFileRecord,
} from "../services/file.service";
import { parseFile, parseDocxHtml } from "../services/parsing.service";
import { db } from "../db/index";
import { files } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { AuthRequest } from "../middleware/auth.middleware";

const mimeByType = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
} satisfies Record<string, string>;

async function validateRemoteMime(url: string, type: keyof typeof mimeByType): Promise<boolean> {
  const response = await fetch(url, { method: "HEAD" });
  if (!response.ok) return false;
  const contentType = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  return contentType === mimeByType[type];
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

  const html = await parseDocxHtml(file.url);
  if (!html) {
    return res.status(422).json({ error: "Could not render a formatted preview for this document" });
  }

  res.json({ data: { html }, message: "DOCX preview generated" });
});

export const uploadFile = asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const userId = req.user.id;
  const { name, type, url, size, folderId } = req.body;

  if (!name || !type || !url) {
    return res.status(400).json({ error: "name, type, and url are required" });
  }

  if (!["pdf", "docx", "txt"].includes(type)) {
    return res.status(400).json({ error: "Invalid file type. Must be pdf, docx, or txt" });
  }

  if (!(await validateRemoteMime(url, type))) {
    return res.status(400).json({ error: "File MIME type does not match file type" });
  }

  const file = await createFileRecord({
    name: name.replace(/[^a-zA-Z0-9.\-_ ]/g, "_"),
    type,
    size: size || 0,
    url,
    userId,
    folderId: folderId || undefined,
  });

  // Trigger text extraction in background
  parseFile(type, url).then(async (text) => {
    if (text) {
      await db
        .update(files)
        .set({ extractedText: text })
        .where(and(eq(files.id, file.id), eq(files.userId, userId)));
    }
  });

  res.status(201).json({ data: file, message: "File uploaded" });
});

export const patchFile = asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const userId = req.user.id;
  const { name, folderId, extractedText } = req.body;

  const file = await getFileById(req.params.id as string, userId);
  if (!file) return res.status(404).json({ error: "File not found" });

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
  res.json({ message: "File deleted" });
});

export const createBlank = asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { name, folderId } = req.body;

  const file = await createFileRecord({
    name: name.replace(/[^a-zA-Z0-9.\-_ ]/g, "_"),
    type: "txt",
    size: 0,
    url: "",
    userId: req.user.id,
    folderId: folderId || undefined,
  });

  res.status(201).json({ data: file, message: "Blank file created" });
});
