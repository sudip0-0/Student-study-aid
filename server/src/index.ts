import "dotenv/config";
import express from "express";
import cors from "cors";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db/index";
import { authRouter } from "./routes/auth.routes";
import { fileRouter } from "./routes/file.routes";
import { folderRouter } from "./routes/folder.routes";
import { highlightRouter } from "./routes/highlight.routes";
import { noteRouter } from "./routes/note.routes";
import { aiRouter } from "./routes/ai.routes";
import { quizRouter } from "./routes/quiz.routes";
import { flashcardRouter } from "./routes/flashcard.routes";
import { searchRouter } from "./routes/search.routes";
import { uploadRouter } from "./routes/upload.routes";
import { cheatsheetRouter } from "./routes/cheatsheet.routes";
import { authMiddleware } from "./middleware/auth.middleware";
import { errorMiddleware } from "./middleware/error.middleware";
import { rateLimit } from "express-rate-limit";

// --- Validate required env vars at startup ---
const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  ENCRYPTION_KEY: z.string().length(64),
  UPLOADTHING_SECRET: z.string().min(1),
  CLIENT_URL: z.string().url().optional(),
  CORS_ORIGINS: z.string().optional(),
  APP_URL: z.string().url().optional(),
  PORT: z.coerce.number().int().positive().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),
});
const envResult = envSchema.safeParse(process.env);
if (!envResult.success) {
  console.error("Missing or invalid environment variables:", envResult.error.format());
  process.exit(1);
}

function resolveCorsOrigins(): string[] {
  const fromList = process.env.CORS_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean) ?? [];
  const clientUrl = process.env.CLIENT_URL?.trim();
  const defaults = ["http://localhost:5173"];
  const merged = [...fromList, ...(clientUrl ? [clientUrl] : []), ...defaults];
  return [...new Set(merged)];
}

const corsOrigins = resolveCorsOrigins();

const app = express();
const PORT = envResult.data.PORT ?? 3001;

// --- Middleware ---
app.use(cors({
  origin(origin, callback) {
    if (!origin || corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));

// Rate limit AI endpoints
const aiLimiter = rateLimit({ windowMs: 60_000, max: 10, message: { error: "Too many AI requests, try again later." } });

// Rate limit auth endpoints
const authLimiter = rateLimit({ windowMs: 60_000, max: 10, message: { error: "Too many attempts, try again later." } });

// --- Routes ---
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/files", authMiddleware, fileRouter);
app.use("/api/folders", authMiddleware, folderRouter);
app.use("/api/highlights", authMiddleware, highlightRouter);
app.use("/api/notes", authMiddleware, noteRouter);
app.use("/api/upload", express.json({ limit: "50mb" }), uploadRouter);
app.use("/api/ai", authMiddleware, aiLimiter, aiRouter);
app.use("/api/quizzes", authMiddleware, quizRouter);
app.use("/api/flashcards", authMiddleware, flashcardRouter);
app.use("/api/cheatsheets", authMiddleware, cheatsheetRouter);
app.use("/api/search", authMiddleware, searchRouter);

// Health check (deployment / uptime probes)
app.get("/api/health", async (_req, res) => {
  try {
    await db.execute(sql`select 1`);
    res.json({
      data: {
        status: "ok",
        database: "connected",
        environment: process.env.NODE_ENV ?? "development",
      },
      message: "Service healthy",
    });
  } catch {
    res.status(503).json({ error: "Database unavailable" });
  }
});

app.use(errorMiddleware);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
