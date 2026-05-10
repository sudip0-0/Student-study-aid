import { Router, Response } from "express";
import { and, eq, desc } from "drizzle-orm";
import { asyncHandler } from "../utils/asyncHandler";
import { validateUUIDParam } from "../utils/validateUUID";
import { AuthRequest } from "../middleware/auth.middleware";
import { db } from "../db/index";
import { cheatsheets, files } from "../db/schema";

export const cheatsheetRouter = Router();

cheatsheetRouter.get("/file/:fileId", validateUUIDParam("fileId"), asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { fileId } = req.params;
  const [file] = await db
    .select({ id: files.id })
    .from(files)
    .where(and(eq(files.id, fileId), eq(files.userId, req.user.id)));
  if (!file) return res.status(404).json({ error: "File not found" });
  const rows = await db
    .select()
    .from(cheatsheets)
    .where(and(eq(cheatsheets.fileId, fileId), eq(cheatsheets.userId, req.user.id)))
    .orderBy(desc(cheatsheets.createdAt));
  res.json({ data: rows, message: "Cheatsheets retrieved" });
}));

cheatsheetRouter.delete("/:id", validateUUIDParam("id"), asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { id } = req.params;
  const [existing] = await db
    .select()
    .from(cheatsheets)
    .where(and(eq(cheatsheets.id, id), eq(cheatsheets.userId, req.user.id)));
  if (!existing) return res.status(404).json({ error: "Cheatsheet not found" });
  await db.delete(cheatsheets).where(and(eq(cheatsheets.id, id), eq(cheatsheets.userId, req.user.id)));
  res.json({ data: null, message: "Cheatsheet deleted" });
}));
