import crypto from "crypto";
import { and, eq, isNull, gt } from "drizzle-orm";
import { db } from "../db/index";
import { refreshTokens } from "../db/schema";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function storeRefreshToken(userId: string, refreshToken: string, familyId?: string) {
  const family = familyId ?? crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.insert(refreshTokens).values({
    userId,
    tokenHash: hashToken(refreshToken),
    familyId: family,
    expiresAt,
  });
  return family;
}

export async function rotateRefreshToken(oldToken: string, newToken: string, userId: string) {
  const oldHash = hashToken(oldToken);
  const [existing] = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.tokenHash, oldHash),
        eq(refreshTokens.userId, userId),
        isNull(refreshTokens.revokedAt),
        gt(refreshTokens.expiresAt, new Date())
      )
    );

  if (!existing) return null;

  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.id, existing.id));

  await storeRefreshToken(userId, newToken, existing.familyId);
  return existing.familyId;
}

export async function revokeRefreshToken(token: string) {
  const hash = hashToken(token);
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(refreshTokens.tokenHash, hash), isNull(refreshTokens.revokedAt)));
}

export async function revokeAllUserRefreshTokens(userId: string) {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
}

export async function isRefreshTokenValid(token: string, userId: string): Promise<boolean> {
  const hash = hashToken(token);
  const [row] = await db
    .select({ id: refreshTokens.id })
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.tokenHash, hash),
        eq(refreshTokens.userId, userId),
        isNull(refreshTokens.revokedAt),
        gt(refreshTokens.expiresAt, new Date())
      )
    );
  return !!row;
}
