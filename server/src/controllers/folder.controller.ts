import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import {
  getUserFolders,
  getAllUserFolders,
  getFolderById,
  createFolder,
  updateFolder,
  deleteFolder,
} from "../services/folder.service";
import { AuthRequest } from "../middleware/auth.middleware";

export const listFolders = asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const userId = req.user.id;
  const parentId = req.query.parentId as string | undefined;
  const result = await getUserFolders(userId, parentId || null);
  res.json({ data: result, message: "Folders retrieved" });
});

export const listAllFolders = asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const userId = req.user.id;
  const result = await getAllUserFolders(userId);
  res.json({ data: result, message: "All folders retrieved" });
});

export const getFolder = asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const folder = await getFolderById(req.params.id as string, req.user.id);
  if (!folder) return res.status(404).json({ error: "Folder not found" });
  res.json({ data: folder, message: "Folder retrieved" });
});

export const createNewFolder = asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { name, parentId, color } = req.body;
  const userId = req.user.id;
  const folder = await createFolder({ name, userId, parentId: parentId ?? null, color });
  res.status(201).json({ data: folder, message: "Folder created" });
});

export const patchFolder = asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const userId = req.user.id;
  const { name, color, parentId } = req.body;
  const folder = await updateFolder(req.params.id as string, userId, { name, color, parentId });
  if (!folder) return res.status(404).json({ error: "Folder not found" });
  res.json({ data: folder, message: "Folder updated" });
});

export const removeFolder = asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const userId = req.user.id;
  const folder = await getFolderById(req.params.id as string, userId);
  if (!folder) return res.status(404).json({ error: "Folder not found" });
  await deleteFolder(req.params.id as string, userId);
  res.json({ message: "Folder deleted" });
});
