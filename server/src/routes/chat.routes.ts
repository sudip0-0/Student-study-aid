import { Router, Response } from "express";
import { z } from "zod";
import { AuthRequest, authMiddleware } from "../middleware/auth.middleware";
import { requireUser } from "../middleware/requireUser";
import { asyncHandler } from "../utils/asyncHandler";
import { validateUUIDParam } from "../utils/validateUUID";
import {
  getChatHistory,
  appendChatMessages,
  clearChatHistory,
} from "../services/chat.service";

export const chatRouter = Router();

chatRouter.get(
  "/file/:fileId",
  authMiddleware,
  validateUUIDParam("fileId"),
  asyncHandler<AuthRequest>(async (req, res: Response) => {
    const user = requireUser(req, res);
    if (!user) return;
    const fileId = req.params.fileId as string;
    const data = await getChatHistory(fileId, user.id);
    res.json({ data, message: "Chat history retrieved" });
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
    const user = requireUser(req, res);
    if (!user) return;
    const fileId = req.params.fileId as string;
    const parsed = appendSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

    const data = await appendChatMessages(fileId, user.id, parsed.data.messages);
    res.status(201).json({ data, message: "Chat messages saved" });
  })
);

chatRouter.delete(
  "/file/:fileId",
  authMiddleware,
  validateUUIDParam("fileId"),
  asyncHandler<AuthRequest>(async (req, res: Response) => {
    const user = requireUser(req, res);
    if (!user) return;
    const fileId = req.params.fileId as string;
    await clearChatHistory(fileId, user.id);
    res.json({ data: null, message: "Chat history cleared" });
  })
);
