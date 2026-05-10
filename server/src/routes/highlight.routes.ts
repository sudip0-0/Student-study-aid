import { Router, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { validateUUIDParam } from "../utils/validateUUID";
import {
  getHighlightsByFileId,
  createHighlight,
  updateHighlight,
  deleteHighlight,
  getFileById,
} from "../services/file.service";
import { AuthRequest } from "../middleware/auth.middleware";

const createSchema = z.object({
  fileId: z.string().uuid(),
  text: z.string().min(1).max(10000),
  color: z.enum(["yellow", "green", "pink", "blue"]).optional(),
  page: z.number().int().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }).optional(),
  note: z.string().max(5000).optional(),
});

const updateSchema = z.object({
  color: z.enum(["yellow", "green", "pink", "blue"]).optional(),
  note: z.string().max(5000).optional(),
}).refine((d) => d.color !== undefined || d.note !== undefined, {
  message: "At least one of color or note must be provided",
});

export const highlightRouter = Router();

highlightRouter.get("/:fileId", validateUUIDParam("fileId"), asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const userId = req.user.id;
  const file = await getFileById(req.params.fileId as string, userId);
  if (!file) return res.status(404).json({ error: "File not found" });
  const highlights = await getHighlightsByFileId(req.params.fileId as string, userId);
  res.json({ data: highlights, message: "Highlights retrieved" });
}));

highlightRouter.post("/", asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const result = createSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });
  const userId = req.user.id;
  const highlight = await createHighlight({ ...result.data, userId });
  if (!highlight) return res.status(404).json({ error: "File not found" });
  res.status(201).json({ data: highlight, message: "Highlight created" });
}));

highlightRouter.patch("/:id", validateUUIDParam("id"), asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const result = updateSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });
  const userId = req.user.id;
  const highlight = await updateHighlight(req.params.id as string, userId, result.data);
  if (!highlight) return res.status(404).json({ error: "Highlight not found" });
  res.json({ data: highlight, message: "Highlight updated" });
}));

highlightRouter.delete("/:id", validateUUIDParam("id"), asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const userId = req.user.id;
  const highlight = await deleteHighlight(req.params.id as string, userId);
  if (!highlight) return res.status(404).json({ error: "Highlight not found" });
  res.json({ data: highlight, message: "Highlight deleted" });
}));
