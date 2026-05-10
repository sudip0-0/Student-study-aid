import { Router } from "express";
import { z } from "zod";
import { register, login, logout, refresh, me } from "../controllers/auth.controller";
import {
  updateProfile,
  updateEmail,
  changePassword,
  saveApiKey,
  updateAiModel,
  testApiKey,
  deleteAccount,
} from "../controllers/settings.controller";
import { authMiddleware } from "../middleware/auth.middleware";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const updateProfileSchema = z.object({
  name: z.string().min(1),
});

const updateEmailSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

const saveApiKeySchema = z.object({
  apiKey: z.string().min(1),
});

const updateAiModelSchema = z.object({
  aiModel: z.string().trim().min(1).max(160).regex(/^[a-z0-9._/:-]+$/i, "Invalid model name"),
});

const testApiKeySchema = z.object({
  apiKey: z.string().optional(),
});

const deleteAccountSchema = z.object({
  confirmation: z.string(),
  password: z.string().min(1),
});

function validate<T>(schema: z.ZodType<T>) {
  return (req: { body: unknown }, res: { status: (c: number) => { json: (b: { error: string }) => unknown } }, next: () => void) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues[0].message });
    }
    req.body = result.data;
    next();
  };
}

authRouter.post("/register", validate(registerSchema), register);
authRouter.post("/login", validate(loginSchema), login);
authRouter.post("/logout", logout);
authRouter.post("/refresh", refresh);
authRouter.get("/me", authMiddleware, me);

authRouter.patch("/settings/profile", authMiddleware, validate(updateProfileSchema), updateProfile);
authRouter.patch("/settings/email", authMiddleware, validate(updateEmailSchema), updateEmail);
authRouter.patch("/settings/password", authMiddleware, validate(changePasswordSchema), changePassword);
authRouter.put("/settings/api-key", authMiddleware, validate(saveApiKeySchema), saveApiKey);
authRouter.patch("/settings/model", authMiddleware, validate(updateAiModelSchema), updateAiModel);
authRouter.post("/settings/test-key", authMiddleware, validate(testApiKeySchema), testApiKey);
authRouter.delete("/settings/account", authMiddleware, validate(deleteAccountSchema), deleteAccount);
