import { db } from "../db/index";
import { files, folders, notes, highlights } from "../db/schema";
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
}) {
  const [file] = await db.insert(files).values(data).returning();
  return file;
}

export async function updateFile(fileId: string, userId: string, updates: { name?: string; folderId?: string | null; extractedText?: string }) {
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

export async function getNotesByFileId(fileId: string, userId: string) {
  return db.query.notes.findMany({
    where: and(eq(notes.fileId, fileId), eq(notes.userId, userId)),
  });
}

export async function getHighlightsByFileId(fileId: string, userId: string) {
  return db.query.highlights.findMany({
    where: and(eq(highlights.fileId, fileId), eq(highlights.userId, userId)),
  });
}

export async function createHighlight(data: {
  userId: string;
  fileId: string;
  text: string;
  color?: string;
  page?: number;
  position?: Record<string, number>;
  note?: string;
}) {
  const file = await getFileById(data.fileId, data.userId);
  if (!file) return null;
  const [highlight] = await db.insert(highlights).values(data).returning();
  return highlight;
}

export async function updateHighlight(
  highlightId: string,
  userId: string,
  updates: { color?: string; note?: string }
) {
  const [highlight] = await db
    .update(highlights)
    .set(updates)
    .where(and(eq(highlights.id, highlightId), eq(highlights.userId, userId)))
    .returning();
  return highlight ?? null;
}

export async function deleteHighlight(highlightId: string, userId: string) {
  const [highlight] = await db
    .delete(highlights)
    .where(and(eq(highlights.id, highlightId), eq(highlights.userId, userId)))
    .returning();
  return highlight ?? null;
}

export async function createNote(data: { userId: string; fileId: string; content: string }) {
  const file = await getFileById(data.fileId, data.userId);
  if (!file) return null;
  const [note] = await db.insert(notes).values(data).returning();
  return note;
}

export async function updateNote(noteId: string, userId: string, updates: { content: string }) {
  const [note] = await db
    .update(notes)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
    .returning();
  return note ?? null;
}

export async function deleteNote(noteId: string, userId: string) {
  const [note] = await db
    .delete(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
    .returning();
  return note ?? null;
}
