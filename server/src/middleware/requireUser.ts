import { Response } from "express";
import { AuthRequest } from "./auth.middleware";

export type AuthedUser = NonNullable<AuthRequest["user"]>;

/** Returns the authenticated user or sends 401 and returns null. */
export function requireUser(req: AuthRequest, res: Response): AuthedUser | null {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return req.user;
}
