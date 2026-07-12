import { Router, Request, Response } from "express";
import crypto from "crypto";
import { UTApi } from "uploadthing/server";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { createFileRecord } from "../services/file.service";
import { assertFolderOwnedByUser } from "../services/folder.service";
import { enqueueExtractionJob } from "../services/extractionJob.service";
import { AuthRequest, authMiddleware } from "../middleware/auth.middleware";
import { requireUser } from "../middleware/requireUser";
import { issueUploadCallbackToken, verifyUploadCallbackToken } from "../utils/uploadCallback";

export const uploadRouter = Router();
const utapi = new UTApi();

const uploadFileSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["pdf", "docx", "txt"]),
  size: z.number().min(0).max(20 * 1024 * 1024),
  folderId: z.string().uuid().nullable().optional(),
  dataUrl: z.string().min(1),
});

const uploadThingSchema = z.object({
  name: z.string().min(1).max(200),
  type: z.enum(["pdf", "docx", "txt"]),
  url: z.string().url(),
  size: z.number().min(0).max(20 * 1024 * 1024).optional(),
  folderId: z.string().uuid().nullable().optional(),
  callbackToken: z.string().min(1),
});

const mimeByType = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
} satisfies Record<string, string>;

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_ ]/g, "_");
}

function isAllowedMime(declared: string, type: keyof typeof mimeByType, fileName: string): boolean {
  const normalized = declared.toLowerCase();
  if (normalized === mimeByType[type]) return true;
  if (
    type === "docx" &&
    normalized === "application/octet-stream" &&
    fileName.toLowerCase().endsWith(".docx")
  ) {
    return true;
  }
  return false;
}

function fileFromDataUrl(dataUrl: string, name: string, type: keyof typeof mimeByType) {
  const match = /^data:([^;,]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw Object.assign(new Error("Invalid file payload"), { statusCode: 400 });
  if (!isAllowedMime(match[1], type, name)) {
    throw Object.assign(new Error("File MIME type does not match file type"), { statusCode: 400 });
  }

  const canonicalMime = mimeByType[type];
  const bytes = Buffer.from(match[2], "base64");
  const blob = new Blob([bytes], { type: canonicalMime });
  return Object.assign(blob, { name, lastModified: Date.now() });
}

async function validateRemoteMime(
  url: string,
  type: keyof typeof mimeByType,
  fileName: string
): Promise<boolean> {
  const response = await fetch(url, { method: "HEAD" });
  if (!response.ok) return false;
  const contentType = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() ?? "";
  return isAllowedMime(contentType, type, fileName);
}

uploadRouter.post("/file", authMiddleware, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;

  const result = uploadFileSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

  const { name, type, size, folderId, dataUrl } = result.data;
  await assertFolderOwnedByUser(folderId, user.id);

  const sanitizedName = sanitizeFileName(name);
  const uploadFile = fileFromDataUrl(dataUrl, sanitizedName, type);
  const uploaded = await utapi.uploadFiles(uploadFile);

  if (uploaded.error || !uploaded.data) {
    return res.status(502).json({ error: uploaded.error?.message || "UploadThing upload failed" });
  }

  const file = await createFileRecord({
    name: sanitizedName,
    type,
    size,
    url: uploaded.data.url,
    userId: user.id,
    folderId: folderId || undefined,
  });

  await enqueueExtractionJob(file.id, user.id);

  res.status(201).json({
    data: { ...file, callbackToken: issueUploadCallbackToken(user.id) },
    message: "File uploaded",
  });
}));

uploadRouter.post("/uploadthing", asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization ?? "";
  const expected = `Bearer ${process.env.UPLOADTHING_SECRET}`;
  if (
    authHeader.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))
  ) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const result = uploadThingSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });
  const { name, type, url, size, folderId, callbackToken } = result.data;

  const userId = verifyUploadCallbackToken(callbackToken);
  if (!userId) {
    return res.status(401).json({ error: "Invalid upload callback token" });
  }

  if (!(await validateRemoteMime(url, type, name))) {
    return res.status(400).json({ error: "File MIME type does not match file type" });
  }

  await assertFolderOwnedByUser(folderId, userId);

  const file = await createFileRecord({
    name: sanitizeFileName(name),
    type,
    size: size || 0,
    url,
    userId,
    folderId: folderId || undefined,
  });

  await enqueueExtractionJob(file.id, userId);

  res.status(201).json({ data: file, message: "File processed" });
}));
