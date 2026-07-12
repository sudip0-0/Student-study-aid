import { db } from "../db/index";
import { notes } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { getFileById } from "./file.service";

export async function getNotesByFileId(fileId: string, userId: string) {
  return db.query.notes.findMany({
    where: and(eq(notes.fileId, fileId), eq(notes.userId, userId)),
  });
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
