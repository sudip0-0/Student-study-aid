import { Router, Response } from "express";
import { and, eq, or, ilike } from "drizzle-orm";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/auth.middleware";
import { db } from "../db/index";
import { files, notes } from "../db/schema";

export const searchRouter = Router();

searchRouter.get("/", asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const q = (req.query.q as string || "").trim();
  if (!q) return res.json({ data: { files: [], notes: [] }, message: "Search results" });

  const escaped = q.replace(/[%_\\]/g, "\\$&");
  const pattern = `%${escaped}%`;

  const fileResults = await db
    .select({ id: files.id, name: files.name, type: files.type })
    .from(files)
    .where(
      and(
        eq(files.userId, req.user.id),
        or(ilike(files.name, pattern), ilike(files.extractedText, pattern))
      )
    )
    .limit(10);

  const noteResults = await db
    .select({ id: notes.id, fileId: notes.fileId, content: notes.content })
    .from(notes)
    .where(and(eq(notes.userId, req.user.id), ilike(notes.content, pattern)))
    .limit(10);

  res.json({ data: { files: fileResults, notes: noteResults }, message: "Search results" });
}));
