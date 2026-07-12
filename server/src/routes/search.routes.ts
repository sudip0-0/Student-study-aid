import { Router, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/auth.middleware";
import { requireUser } from "../middleware/requireUser";
import { searchUserContent } from "../services/search.service";

export const searchRouter = Router();

searchRouter.get("/", asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req, res);
  if (!user) return;

  const q = typeof req.query.q === "string" ? req.query.q : "";
  const data = await searchUserContent(user.id, q);
  res.json({ data, message: "Search results" });
}));
