import { and, eq, desc } from "drizzle-orm";
import { db } from "../db/index";
import { quizzes, files } from "../db/schema";

export async function listUserQuizzes(userId: string) {
  return db
    .select({
      id: quizzes.id,
      userId: quizzes.userId,
      fileId: quizzes.fileId,
      title: quizzes.title,
      questions: quizzes.questions,
      score: quizzes.score,
      attemptedAt: quizzes.attemptedAt,
      createdAt: quizzes.createdAt,
      fileName: files.name,
    })
    .from(quizzes)
    .leftJoin(files, eq(quizzes.fileId, files.id))
    .where(eq(quizzes.userId, userId))
    .orderBy(desc(quizzes.createdAt));
}

export async function listQuizzesForFile(fileId: string, userId: string) {
  const [file] = await db
    .select({ id: files.id })
    .from(files)
    .where(and(eq(files.id, fileId), eq(files.userId, userId)));
  if (!file) return null;
  const rows = await db
    .select()
    .from(quizzes)
    .where(and(eq(quizzes.fileId, fileId), eq(quizzes.userId, userId)))
    .orderBy(desc(quizzes.createdAt));
  return rows;
}

export async function saveQuizAttempt(id: string, userId: string, score: number) {
  const [existing] = await db
    .select()
    .from(quizzes)
    .where(and(eq(quizzes.id, id), eq(quizzes.userId, userId)));
  if (!existing) return null;
  const [updated] = await db
    .update(quizzes)
    .set({ score, attemptedAt: new Date() })
    .where(and(eq(quizzes.id, id), eq(quizzes.userId, userId)))
    .returning();
  return updated;
}

export async function deleteQuiz(id: string, userId: string) {
  const [existing] = await db
    .select()
    .from(quizzes)
    .where(and(eq(quizzes.id, id), eq(quizzes.userId, userId)));
  if (!existing) return false;
  await db.delete(quizzes).where(and(eq(quizzes.id, id), eq(quizzes.userId, userId)));
  return true;
}
