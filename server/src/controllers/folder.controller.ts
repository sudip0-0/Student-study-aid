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
import { requireUser } from "../middleware/requireUser";

export const listFolders = asyncHandler<AuthRequest>(async (req, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  const parentId = req.query.parentId as string | undefined;
  const result = await getUserFolders(user.id, parentId || null);
  res.json({ data: result, message: "Folders retrieved" });
});

export const listAllFolders = asyncHandler<AuthRequest>(async (req, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  const result = await getAllUserFolders(user.id);
  res.json({ data: result, message: "All folders retrieved" });
});

export const getFolder = asyncHandler<AuthRequest>(async (req, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  const folder = await getFolderById(req.params.id as string, user.id);
  if (!folder) return res.status(404).json({ error: "Folder not found" });
  res.json({ data: folder, message: "Folder retrieved" });
});

export const createNewFolder = asyncHandler<AuthRequest>(async (req, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  const { name, parentId, color } = req.body;
  const folder = await createFolder({
    name,
    userId: user.id,
    parentId: parentId ?? null,
    color,
  });
  res.status(201).json({ data: folder, message: "Folder created" });
});

export const patchFolder = asyncHandler<AuthRequest>(async (req, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  const { name, color, parentId } = req.body;
  const folder = await updateFolder(req.params.id as string, user.id, { name, color, parentId });
  if (!folder) return res.status(404).json({ error: "Folder not found" });
  res.json({ data: folder, message: "Folder updated" });
});

export const removeFolder = asyncHandler<AuthRequest>(async (req, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;
  const folder = await getFolderById(req.params.id as string, user.id);
  if (!folder) return res.status(404).json({ error: "Folder not found" });
  await deleteFolder(req.params.id as string, user.id);
  res.json({ message: "Folder deleted" });
});
