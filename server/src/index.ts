import "dotenv/config";
import express from "express";
import cors from "cors";
import { z } from "zod";
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
});
const envResult = envSchema.safeParse(process.env);
if (!envResult.success) {
  console.error("Missing or invalid environment variables:", envResult.error.format());
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
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

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use(errorMiddleware);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
