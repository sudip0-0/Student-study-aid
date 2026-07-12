import { db } from "../db/index";
import { highlights } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { getFileById } from "./file.service";

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
