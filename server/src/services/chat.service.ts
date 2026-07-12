import { and, asc, eq, max } from "drizzle-orm";
import { db } from "../db/index";
import { chatMessages, files } from "../db/schema";

async function assertFileOwned(fileId: string, userId: string) {
  const [file] = await db
    .select({ id: files.id })
    .from(files)
    .where(and(eq(files.id, fileId), eq(files.userId, userId)));
  if (!file) {
    throw Object.assign(new Error("File not found"), { statusCode: 404, expose: true });
  }
}

export async function getChatHistory(fileId: string, userId: string) {
  await assertFileOwned(fileId, userId);
  const rows = await db
    .select({
      id: chatMessages.id,
      role: chatMessages.role,
      content: chatMessages.content,
      createdAt: chatMessages.createdAt,
      sortOrder: chatMessages.sortOrder,
    })
    .from(chatMessages)
    .where(and(eq(chatMessages.fileId, fileId), eq(chatMessages.userId, userId)))
    .orderBy(asc(chatMessages.sortOrder), asc(chatMessages.createdAt));

  return rows.map((r) => ({
    id: r.id,
    role: r.role as "user" | "assistant",
    content: r.content,
    createdAt: r.createdAt,
  }));
}

export async function appendChatMessages(
  fileId: string,
  userId: string,
  messages: { role: "user" | "assistant"; content: string }[]
) {
  await assertFileOwned(fileId, userId);

  const [agg] = await db
    .select({ maxOrder: max(chatMessages.sortOrder) })
    .from(chatMessages)
    .where(and(eq(chatMessages.fileId, fileId), eq(chatMessages.userId, userId)));

  let nextOrder = (agg?.maxOrder ?? -1) + 1;
  const values = messages.map((m) => ({
    userId,
    fileId,
    role: m.role,
    content: m.content,
    sortOrder: nextOrder++,
  }));

  const inserted = await db.insert(chatMessages).values(values).returning({
    id: chatMessages.id,
    role: chatMessages.role,
    content: chatMessages.content,
    createdAt: chatMessages.createdAt,
  });

  return inserted.map((r) => ({
    id: r.id,
    role: r.role as "user" | "assistant",
    content: r.content,
    createdAt: r.createdAt,
  }));
}

export async function clearChatHistory(fileId: string, userId: string) {
  await assertFileOwned(fileId, userId);
  await db
    .delete(chatMessages)
    .where(and(eq(chatMessages.fileId, fileId), eq(chatMessages.userId, userId)));
}
