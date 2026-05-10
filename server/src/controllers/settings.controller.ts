import { Response } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { asyncHandler } from "../utils/asyncHandler";
import { decryptSecret, encryptSecret } from "../utils/encrypt";
import { db } from "../db/index";
import { users, files } from "../db/schema";
import { AuthRequest } from "../middleware/auth.middleware";

export const updateProfile = asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { name } = req.body;

  const [updated] = await db
    .update(users)
    .set({ name })
    .where(eq(users.id, req.user.id))
    .returning({ id: users.id, email: users.email, name: users.name, apiKey: users.apiKey, aiModel: users.aiModel });

  res.json({
    data: { id: updated.id, email: updated.email, name: updated.name, hasApiKey: !!updated.apiKey, aiModel: updated.aiModel },
    message: "Profile updated",
  });
});

export const updateEmail = asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { email, password } = req.body;

  const [user] = await db.select({ password: users.password }).from(users).where(eq(users.id, req.user.id));
  if (!user) return res.status(404).json({ error: "User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Incorrect password" });

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (existing && existing.id !== req.user.id) {
    return res.status(400).json({ error: "Email already in use" });
  }

  const [updated] = await db
    .update(users)
    .set({ email })
    .where(eq(users.id, req.user.id))
    .returning({ id: users.id, email: users.email, name: users.name, apiKey: users.apiKey, aiModel: users.aiModel });

  res.json({
    data: { id: updated.id, email: updated.email, name: updated.name, hasApiKey: !!updated.apiKey, aiModel: updated.aiModel },
    message: "Email updated",
  });
});

export const changePassword = asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { currentPassword, newPassword } = req.body;

  const [user] = await db.select({ password: users.password }).from(users).where(eq(users.id, req.user.id));
  if (!user) return res.status(404).json({ error: "User not found" });

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return res.status(401).json({ error: "Incorrect current password" });

  const hashed = await bcrypt.hash(newPassword, 12);
  await db.update(users).set({ password: hashed }).where(eq(users.id, req.user.id));

  res.json({ data: null, message: "Password changed" });
});

export const saveApiKey = asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { apiKey } = req.body;

  const encrypted = encryptSecret(apiKey);
  await db.update(users).set({ apiKey: encrypted }).where(eq(users.id, req.user.id));

  res.json({ data: { hasApiKey: true }, message: "API key saved" });
});

export const updateAiModel = asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { aiModel } = req.body;

  const [updated] = await db
    .update(users)
    .set({ aiModel })
    .where(eq(users.id, req.user.id))
    .returning({ id: users.id, email: users.email, name: users.name, apiKey: users.apiKey, aiModel: users.aiModel });

  res.json({
    data: { id: updated.id, email: updated.email, name: updated.name, hasApiKey: !!updated.apiKey, aiModel: updated.aiModel },
    message: "AI model updated",
  });
});

export const testApiKey = asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  let keyToTest: string | undefined = req.body.apiKey;

  if (!keyToTest) {
    const [user] = await db.select({ apiKey: users.apiKey }).from(users).where(eq(users.id, req.user.id));
    if (!user?.apiKey) {
      return res.status(400).json({ error: "No API key configured" });
    }
    keyToTest = decryptSecret(user.apiKey);
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/auth/key", {
      headers: { Authorization: `Bearer ${keyToTest}` },
    });
    const data = await response.json() as { data?: { label?: string }; error?: { message?: string } };

    if (response.ok && data.data) {
      res.json({ data: { valid: true, label: data.data.label }, message: "API key is valid" });
    } else {
      res.json({ data: { valid: false }, message: data.error?.message || "Invalid API key" });
    }
  } catch {
    res.status(502).json({ error: "Could not verify API key" });
  }
});

export const deleteAccount = asyncHandler<AuthRequest>(async (req, res: Response) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { confirmation, password } = req.body;

  if (confirmation !== "DELETE") {
    return res.status(400).json({ error: "Type DELETE to confirm" });
  }

  const [user] = await db
    .select({ password: users.password, email: users.email })
    .from(users)
    .where(eq(users.id, req.user.id));
  if (!user) return res.status(404).json({ error: "User not found" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Incorrect password" });

  // Clean up UploadThing files before deleting user
  const userFiles = await db.select({ url: files.url }).from(files).where(eq(files.userId, req.user.id));
  if (userFiles.length > 0) {
    const utapi = new UTApi();
    const fileKeys = userFiles
      .map((f) => f.url.split("/").pop())
      .filter((k): k is string => !!k);
    if (fileKeys.length > 0) {
      await utapi.deleteFiles(fileKeys).catch(() => {});
    }
  }

  await db.delete(users).where(eq(users.id, req.user.id));

  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth",
  });

  res.json({ data: null, message: "Account deleted" });
});
