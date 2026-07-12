import { db } from "../db/index";
import { files, folders } from "../db/schema";
import { eq, and } from "drizzle-orm";

export async function getFileById(fileId: string, userId: string) {
  return db.query.files.findFirst({
    where: and(eq(files.id, fileId), eq(files.userId, userId)),
  });
}

export async function getUserFiles(userId: string, folderId?: string) {
  const conditions = [eq(files.userId, userId)];
  if (folderId) conditions.push(eq(files.folderId, folderId));
  return db.query.files.findMany({ where: and(...conditions) });
}

export async function createFileRecord(data: {
  name: string;
  type: string;
  size: number;
  url: string;
  userId: string;
  folderId?: string;
  extractionStatus?: string;
  extractedText?: string;
}) {
  const [file] = await db.insert(files).values(data).returning();
  return file;
}

export async function updateFile(
  fileId: string,
  userId: string,
  updates: {
    name?: string;
    folderId?: string | null;
    extractedText?: string;
    extractedHtml?: string | null;
    extractionStatus?: string;
    lastSummary?: string | null;
    lastSummaryLength?: string | null;
  }
) {
  const [file] = await db.update(files).set(updates).where(and(eq(files.id, fileId), eq(files.userId, userId))).returning();
  return file;
}

export async function deleteFileRecord(fileId: string, userId: string) {
  await db.delete(files).where(and(eq(files.id, fileId), eq(files.userId, userId)));
}

export async function getFolders(userId: string, parentId?: string) {
  const conditions = [eq(folders.userId, userId)];
  if (parentId) conditions.push(eq(folders.parentId, parentId));
  return db.query.folders.findMany({ where: and(...conditions) });
}

export async function getFolderById(folderId: string, userId: string) {
  return db.query.folders.findFirst({
    where: and(eq(folders.id, folderId), eq(folders.userId, userId)),
  });
}

export async function createFolder(data: { name: string; userId: string; parentId?: string; color?: string }) {
  const [folder] = await db.insert(folders).values(data).returning();
  return folder;
}

export async function deleteFolderRecord(folderId: string, userId: string) {
  await db.delete(folders).where(and(eq(folders.id, folderId), eq(folders.userId, userId)));
}
