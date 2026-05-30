import { summarizePrompt, quizPrompt, flashcardsPrompt, cheatsheetPrompt, explainPrompt, chatPrompt } from "./prompts";
import { z } from "zod";

type ChatRole = "system" | "user" | "assistant";

const openRouterResponseSchema = z.object({
  choices: z.array(z.object({
    message: z.object({
      content: z.string(),
    }),
  })).min(1),
});

const openRouterErrorSchema = z.object({
  error: z.object({
    message: z.string().optional(),
    code: z.union([z.string(), z.number()]).optional(),
  }).optional(),
});

const quizResponseSchema = z.object({
  questions: z.array(z.object({
    question: z.string().min(1),
    options: z.array(z.string().min(1)).length(4),
    answer: z.enum(["A", "B", "C", "D"]),
    explanation: z.string().optional(),
  })).min(1),
});

const flashcardResponseSchema = z.object({
  cards: z.array(z.object({
    front: z.string().min(1),
    back: z.string().min(1),
  })).min(1),
});

const cheatsheetResponseSchema = z.object({
  sections: z.array(z.object({
    title: z.string().min(1),
    points: z.array(z.string().min(1)).min(1),
  })).min(1),
});

function aiInvalidResponseError() {
  return Object.assign(new Error("AI returned invalid response"), { statusCode: 500, expose: true });
}

function parseJsonResponse(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw aiInvalidResponseError();
  }
}

function cleanOpenRouterMessage(message: string | undefined): string | undefined {
  const cleaned = message?.replace(/\s+/g, " ").trim();
  if (!cleaned) return undefined;
  return cleaned.length > 300 ? `${cleaned.slice(0, 297)}...` : cleaned;
}

async function readOpenRouterError(response: Response): Promise<string | undefined> {
  const body = await response.text();
  if (!body) return undefined;

  try {
    const parsed = openRouterErrorSchema.safeParse(JSON.parse(body) as unknown);
    if (!parsed.success) return undefined;
    return cleanOpenRouterMessage(parsed.data.error?.message);
  } catch {
    return undefined;
  }
}

function openRouterRequestError(status: number, details: string | undefined) {
  const suffix = details ? ` ${details}` : "";

  if (status === 400 || status === 404) {
    return Object.assign(
      new Error(`OpenRouter rejected the selected AI model or request.${suffix}`),
      { statusCode: 400, expose: true }
    );
  }

  if (status === 401) {
    return Object.assign(
      new Error(`OpenRouter API key was rejected. Re-save a valid key in Settings.${suffix}`),
      { statusCode: 400, expose: true }
    );
  }

  if (status === 402) {
    return Object.assign(
      new Error(`OpenRouter rejected the request for billing or credits. Check your OpenRouter account balance, credits, or selected model access.${suffix}`),
      { statusCode: 402, expose: true }
    );
  }

  if (status === 403) {
    return Object.assign(
      new Error(`OpenRouter blocked access to the selected model. Choose a different model or check model permissions.${suffix}`),
      { statusCode: 403, expose: true }
    );
  }

  if (status === 429) {
    return Object.assign(
      new Error(`OpenRouter rate limit reached. Try again later.${suffix}`),
      { statusCode: 429, expose: true }
    );
  }

  return Object.assign(
    new Error(`OpenRouter is temporarily unavailable or returned an upstream error.${suffix}`),
    { statusCode: 502, expose: true }
  );
}

const OPENROUTER_TIMEOUT_MS = 120_000;

async function callOpenRouter(apiKey: string, model: string, messages: { role: ChatRole; content: string }[]) {
  let response: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);
  try {
    response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL || "http://localhost:5173",
        "X-Title": "Lumio",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
      }),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw Object.assign(
        new Error("OpenRouter took too long to respond. Try again or choose a faster model."),
        { statusCode: 504, expose: true }
      );
    }
    throw Object.assign(new Error("Could not reach OpenRouter. Check your network connection and try again."), { statusCode: 502, expose: true });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw openRouterRequestError(response.status, await readOpenRouterError(response));
  }

  const parsed = openRouterResponseSchema.safeParse(await response.json());
  if (!parsed.success) throw aiInvalidResponseError();
  const data = parsed.data;
  return data.choices[0].message.content;
}

export async function summarize(apiKey: string, model: string, text: string, length: "short" | "medium" | "long" = "medium") {
  const { system, user } = summarizePrompt(text, length);
  return callOpenRouter(apiKey, model, [
    { role: "system", content: system },
    { role: "user", content: user },
  ]);
}

export async function generateQuiz(apiKey: string, model: string, text: string, count = 5) {
  const { system, user } = quizPrompt(text, count);
  const result = await callOpenRouter(apiKey, model, [
    { role: "system", content: system },
    { role: "user", content: user },
  ]);
  const parsed = quizResponseSchema.safeParse(parseJsonResponse(result));
  if (!parsed.success) throw aiInvalidResponseError();
  return parsed.data.questions;
}

export async function generateFlashcards(apiKey: string, model: string, text: string, count = 10) {
  const { system, user } = flashcardsPrompt(text, count);
  const result = await callOpenRouter(apiKey, model, [
    { role: "system", content: system },
    { role: "user", content: user },
  ]);
  const parsed = flashcardResponseSchema.safeParse(parseJsonResponse(result));
  if (!parsed.success) throw aiInvalidResponseError();
  return parsed.data.cards;
}

export async function generateCheatsheet(apiKey: string, model: string, text: string) {
  const { system, user } = cheatsheetPrompt(text);
  const result = await callOpenRouter(apiKey, model, [
    { role: "system", content: system },
    { role: "user", content: user },
  ]);
  const parsed = cheatsheetResponseSchema.safeParse(parseJsonResponse(result));
  if (!parsed.success) throw aiInvalidResponseError();
  return parsed.data.sections;
}

export async function explain(apiKey: string, model: string, text: string, level: "simple" | "moderate" | "detailed" = "moderate") {
  const { system, user } = explainPrompt(text, level);
  return callOpenRouter(apiKey, model, [
    { role: "system", content: system },
    { role: "user", content: user },
  ]);
}

export async function chat(
  apiKey: string,
  model: string,
  text: string,
  history: { role: "user" | "assistant"; content: string }[]
) {
  const { messages } = chatPrompt(text, history);
  return callOpenRouter(apiKey, model, messages);
}
