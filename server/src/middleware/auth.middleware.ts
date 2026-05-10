import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db/index";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export interface AuthRequest extends Request {
  user?: { id: string; email: string; name: string; hasApiKey: boolean; aiModel: string };
}

export function generateTokens(userId: string) {
  const accessToken = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ sub: userId }, JWT_REFRESH_SECRET, { expiresIn: "7d" });
  return { accessToken, refreshToken };
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };

    const [user] = await db
      .select({ id: users.id, email: users.email, name: users.name, apiKey: users.apiKey, aiModel: users.aiModel })
      .from(users)
      .where(eq(users.id, decoded.sub));

    if (!user) return res.status(401).json({ error: "User not found" });

    req.user = { id: user.id, email: user.email, name: user.name, hasApiKey: !!user.apiKey, aiModel: user.aiModel };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
