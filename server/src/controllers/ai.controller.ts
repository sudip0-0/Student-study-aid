import { Response } from "express";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import {
  summarize,
  generateQuiz,
  generateFlashcards,
  generateCheatsheet,
  explain,
  chat,
} from "../services/ai.service";
import { db } from "../db/index";
import { users, files, quizzes, flashcards, cheatsheets } from "../db/schema";
import { AuthRequest } from "../middleware/auth.middleware";
import { decryptSecret } from "../utils/encrypt";

const summarizeSchema = z.object({
  fileId: z.string().uuid(),
  length: z.enum(["short", "medium", "long"]).optional(),
});

const countSchema = z.number().int().min(1).max(20).optional();

const quizSchema = z.object({
  fileId: z.string().uuid(),
  count: countSchema,
});

const flashcardsSchema = z.object({
  fileId: z.string().uuid(),
  count: countSchema,
});

const cheatsheetSchema = z.object({
  fileId: z.string().uuid(),
});

const explainSchema = z.object({
  text: z.string().trim().min(1).max(10000),
  level: z.enum(["simple", "moderate", "detailed"]).optional(),
});

const chatSchema = z.object({
  fileId: z.string().uuid(),
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(4000),
  })).min(1).max(30),
});

function parseBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw Object.assign(new Error(result.error.issues[0].message), { statusCode: 400 });
  }
  return result.data;
}

async function getAiSettings(userId: string): Promise<{ apiKey: string; aiModel: string }> {
  const [user] = await db.select({ apiKey: users.apiKey, aiModel: users.aiModel }).from(users).where(eq(users.id, userId));
  if (!user?.apiKey) throw Object.assign(new Error("No API key configured"), { statusCode: 400 });
  return { apiKey: decryptSecret(user.apiKey), aiModel: user.aiModel };
}

async function getFileText(fileId: string, userId: string): Promise<string> {
  const [file] = await db
    .select({ extractedText: files.extractedText, name: files.name })
    .from(files)
    .where(and(eq(files.id, fileId), eq(files.userId, userId)));
  if (!file) throw Object.assign(new Error("File not found"), { statusCode: 404 });
  if (!file.extractedText) throw Object.assign(new Error("This file has no extracted text to analyze"), { statusCode: 400 });
  return file.extractedText;
}

export const summarizeDoc = asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { fileId, length } = parseBody(summarizeSchema, req.body);
  const text = await getFileText(fileId, req.user.id);
  const { apiKey, aiModel } = await getAiSettings(req.user.id);
  const data = await summarize(apiKey, aiModel, text, length || "medium");
  res.json({ data, message: "Summary generated" });
});

export const quizDoc = asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { fileId, count } = parseBody(quizSchema, req.body);
  const text = await getFileText(fileId, req.user.id);
  const { apiKey, aiModel } = await getAiSettings(req.user.id);
  const questions = await generateQuiz(apiKey, aiModel, text, count || 5);
  const [saved] = await db
    .insert(quizzes)
    .values({
      userId: req.user.id,
      fileId,
      title: `Quiz - ${new Date().toLocaleDateString()}`,
      questions,
    })
    .returning();
  res.json({ data: saved, message: "Quiz generated and saved" });
});

export const flashcardsDoc = asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { fileId, count } = parseBody(flashcardsSchema, req.body);
  const text = await getFileText(fileId, req.user.id);
  const { apiKey, aiModel } = await getAiSettings(req.user.id);
  const cards = await generateFlashcards(apiKey, aiModel, text, count || 10);
  const [saved] = await db
    .insert(flashcards)
    .values({
      userId: req.user.id,
      fileId,
      deckName: `Flashcards - ${new Date().toLocaleDateString()}`,
      cards,
    })
    .returning();
  res.json({ data: saved, message: "Flashcards generated and saved" });
});

export const cheatsheetDoc = asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { fileId } = parseBody(cheatsheetSchema, req.body);
  const text = await getFileText(fileId, req.user.id);
  const { apiKey, aiModel } = await getAiSettings(req.user.id);
  const data = await generateCheatsheet(apiKey, aiModel, text);
  const [saved] = await db
    .insert(cheatsheets)
    .values({
      userId: req.user.id,
      fileId,
      title: `Cheatsheet - ${new Date().toLocaleDateString()}`,
      sections: data,
    })
    .returning();
  res.json({ data: saved, message: "Cheatsheet generated and saved" });
});

export const explainDoc = asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { text, level } = parseBody(explainSchema, req.body);
  const { apiKey, aiModel } = await getAiSettings(req.user.id);
  const data = await explain(apiKey, aiModel, text, level || "moderate");
  res.json({ data, message: "Explanation generated" });
});

export const chatDoc = asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { fileId, messages } = parseBody(chatSchema, req.body);
  const text = await getFileText(fileId, req.user.id);
  const { apiKey, aiModel } = await getAiSettings(req.user.id);
  const data = await chat(apiKey, aiModel, text, messages);
  res.json({ data, message: "Chat response generated" });
});
