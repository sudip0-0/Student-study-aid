import { Router, Response } from "express";
import { and, eq, desc } from "drizzle-orm";
import { asyncHandler } from "../utils/asyncHandler";
import { validateUUIDParam } from "../utils/validateUUID";
import { AuthRequest } from "../middleware/auth.middleware";
import { requireUser } from "../middleware/requireUser";
import { db } from "../db/index";
import { cheatsheets, files } from "../db/schema";

export const cheatsheetRouter = Router();

cheatsheetRouter.get("/file/:fileId", validateUUIDParam("fileId"), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  const { fileId } = req.params;
  const [file] = await db
    .select({ id: files.id })
    .from(files)
    .where(and(eq(files.id, fileId), eq(files.userId, user.id)));
  if (!file) return res.status(404).json({ error: "File not found" });
  const rows = await db
    .select()
    .from(cheatsheets)
    .where(and(eq(cheatsheets.fileId, fileId), eq(cheatsheets.userId, user.id)))
    .orderBy(desc(cheatsheets.createdAt));
  res.json({ data: rows, message: "Cheatsheets retrieved" });
}));

cheatsheetRouter.delete("/:id", validateUUIDParam("id"), asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  const { id } = req.params;
  const [existing] = await db
    .select()
    .from(cheatsheets)
    .where(and(eq(cheatsheets.id, id), eq(cheatsheets.userId, user.id)));
  if (!existing) return res.status(404).json({ error: "Cheatsheet not found" });
  await db.delete(cheatsheets).where(and(eq(cheatsheets.id, id), eq(cheatsheets.userId, user.id)));
  res.json({ data: null, message: "Cheatsheet deleted" });
}));
