import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db/index";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { AuthRequest, generateTokens } from "../middleware/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const refreshCookieName = "refreshToken";

function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie(refreshCookieName, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(refreshCookieName, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth",
  });
}

function readCookie(req: Request, name: string): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const match = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) return res.status(400).json({ error: "Email already registered" });

  const hashed = await bcrypt.hash(password, 12);
  const [user] = await db.insert(users).values({ email, password: hashed, name }).returning();

  const tokens = generateTokens(user.id);
  setRefreshCookie(res, tokens.refreshToken);

  res.json({
    data: { user: { id: user.id, email: user.email, name: user.name, hasApiKey: false, aiModel: user.aiModel }, accessToken: tokens.accessToken },
    message: "User registered",
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const tokens = generateTokens(user.id);
  setRefreshCookie(res, tokens.refreshToken);

  res.json({
    data: { user: { id: user.id, email: user.email, name: user.name, hasApiKey: !!user.apiKey, aiModel: user.aiModel }, accessToken: tokens.accessToken },
    message: "Logged in",
  });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  clearRefreshCookie(res);
  res.json({ message: "Logged out" });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = readCookie(req, refreshCookieName) ?? req.body.refreshToken;
  if (!refreshToken) return res.status(400).json({ error: "No refresh token" });

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { sub: string };
    const [user] = await db.select().from(users).where(eq(users.id, decoded.sub));
    if (!user) return res.status(401).json({ error: "User not found" });

    const tokens = generateTokens(user.id);
    setRefreshCookie(res, tokens.refreshToken);
    res.json({ data: { accessToken: tokens.accessToken }, message: "Token refreshed" });
  } catch {
    clearRefreshCookie(res);
    return res.status(401).json({ error: "Invalid refresh token" });
  }
});

export const me = asyncHandler<AuthRequest>(async (req, res: Response) => {
  res.json({ data: req.user, message: "User info" });
});
