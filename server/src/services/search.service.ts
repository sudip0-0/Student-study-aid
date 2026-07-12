import { and, eq, or, ilike } from "drizzle-orm";
import { db } from "../db/index";
import { files, notes } from "../db/schema";
import { escapeLikePattern } from "../utils/escapeLike";

export async function searchUserContent(userId: string, q: string) {
  const trimmed = q.trim();
  if (!trimmed) return { files: [], notes: [] };

  const pattern = `%${escapeLikePattern(trimmed)}%`;

  const fileResults = await db
    .select({ id: files.id, name: files.name, type: files.type })
    .from(files)
    .where(
      and(
        eq(files.userId, userId),
        or(ilike(files.name, pattern), ilike(files.extractedText, pattern))
      )
    )
    .limit(10);

  const noteResults = await db
    .select({ id: notes.id, fileId: notes.fileId, content: notes.content })
    .from(notes)
    .where(and(eq(notes.userId, userId), ilike(notes.content, pattern)))
    .limit(10);

  return { files: fileResults, notes: noteResults };
}
