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
import { validateBody } from "../middleware/validate";

export const authRouter = Router();

const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .regex(/[A-Za-z]/, "Password must include a letter")
  .regex(/[0-9]/, "Password must include a number");

const registerSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
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
  newPassword: passwordSchema,
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

authRouter.post("/register", validateBody(registerSchema), register);
authRouter.post("/login", validateBody(loginSchema), login);
authRouter.post("/logout", logout);
authRouter.post("/refresh", refresh);
authRouter.get("/me", authMiddleware, me);

authRouter.patch("/settings/profile", authMiddleware, validateBody(updateProfileSchema), updateProfile);
authRouter.patch("/settings/email", authMiddleware, validateBody(updateEmailSchema), updateEmail);
authRouter.patch("/settings/password", authMiddleware, validateBody(changePasswordSchema), changePassword);
authRouter.put("/settings/api-key", authMiddleware, validateBody(saveApiKeySchema), saveApiKey);
authRouter.patch("/settings/model", authMiddleware, validateBody(updateAiModelSchema), updateAiModel);
authRouter.post("/settings/test-key", authMiddleware, validateBody(testApiKeySchema), testApiKey);
authRouter.delete("/settings/account", authMiddleware, validateBody(deleteAccountSchema), deleteAccount);
