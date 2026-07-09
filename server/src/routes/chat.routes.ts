import { Router, Response } from "express";
import { and, asc, eq, max } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index";
import { chatMessages, files } from "../db/schema";
import { AuthRequest, authMiddleware } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { validateUUIDParam } from "../utils/validateUUID";

export const chatRouter = Router();

async function assertFileOwned(fileId: string, userId: string) {
  const [file] = await db
    .select({ id: files.id })
    .from(files)
    .where(and(eq(files.id, fileId), eq(files.userId, userId)));
  if (!file) {
    throw Object.assign(new Error("File not found"), { statusCode: 404, expose: true });
  }
}

chatRouter.get(
  "/file/:fileId",
  authMiddleware,
  validateUUIDParam("fileId"),
  asyncHandler<AuthRequest>(async (req, res: Response) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const fileId = req.params.fileId as string;
    await assertFileOwned(fileId, req.user.id);

    const rows = await db
      .select({
        id: chatMessages.id,
        role: chatMessages.role,
        content: chatMessages.content,
        createdAt: chatMessages.createdAt,
        sortOrder: chatMessages.sortOrder,
      })
      .from(chatMessages)
      .where(and(eq(chatMessages.fileId, fileId), eq(chatMessages.userId, req.user.id)))
      .orderBy(asc(chatMessages.sortOrder), asc(chatMessages.createdAt));

    res.json({
      data: rows.map((r) => ({
        id: r.id,
        role: r.role as "user" | "assistant",
        content: r.content,
        createdAt: r.createdAt,
      })),
      message: "Chat history retrieved",
    });
  })
);

const appendSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(8000),
      })
    )
    .min(1)
    .max(10),
});

chatRouter.post(
  "/file/:fileId",
  authMiddleware,
  validateUUIDParam("fileId"),
  asyncHandler<AuthRequest>(async (req, res: Response) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const fileId = req.params.fileId as string;
    const parsed = appendSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

    await assertFileOwned(fileId, req.user.id);

    const [agg] = await db
      .select({ maxOrder: max(chatMessages.sortOrder) })
      .from(chatMessages)
      .where(and(eq(chatMessages.fileId, fileId), eq(chatMessages.userId, req.user.id)));

    let nextOrder = (agg?.maxOrder ?? -1) + 1;
    const values = parsed.data.messages.map((m) => ({
      userId: req.user!.id,
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

    res.status(201).json({
      data: inserted.map((r) => ({
        id: r.id,
        role: r.role as "user" | "assistant",
        content: r.content,
        createdAt: r.createdAt,
      })),
      message: "Chat messages saved",
    });
  })
);

chatRouter.delete(
  "/file/:fileId",
  authMiddleware,
  validateUUIDParam("fileId"),
  asyncHandler<AuthRequest>(async (req, res: Response) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const fileId = req.params.fileId as string;
    await assertFileOwned(fileId, req.user.id);

    await db
      .delete(chatMessages)
      .where(and(eq(chatMessages.fileId, fileId), eq(chatMessages.userId, req.user.id)));

    res.json({ data: null, message: "Chat history cleared" });
  })
);
