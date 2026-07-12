import { Router } from "express";
import { z } from "zod";
import {
  listFolders,
  listAllFolders,
  getFolder,
  createNewFolder,
  patchFolder,
  removeFolder,
} from "../controllers/folder.controller";
import { validateUUIDParam } from "../utils/validateUUID";
import { validateBody } from "../middleware/validate";

export const folderRouter = Router();

const createSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(100),
  parentId: z.string().uuid().nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  parentId: z.string().uuid().nullable().optional(),
});

folderRouter.get("/", listFolders);
folderRouter.get("/all", listAllFolders);
folderRouter.get("/:id", validateUUIDParam("id"), getFolder);

folderRouter.post("/", validateBody(createSchema), createNewFolder);

folderRouter.patch("/:id", validateUUIDParam("id"), validateBody(updateSchema), patchFolder);

folderRouter.delete("/:id", validateUUIDParam("id"), removeFolder);
