import { beforeEach, describe, expect, it, vi } from "vitest";

const insertValues = vi.fn();
const updateSet = vi.fn();
const selectFrom = vi.fn();

vi.mock("../db/index", () => ({
  db: {
    insert: vi.fn(() => ({ values: insertValues })),
    update: vi.fn(() => ({ set: updateSet })),
    select: vi.fn(() => ({ from: selectFrom })),
  },
}));

import {
  storeRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  isRefreshTokenValid,
} from "./refreshToken.service";

describe("refreshToken.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertValues.mockResolvedValue(undefined);
    updateSet.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    selectFrom.mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    });
  });

  it("storeRefreshToken inserts hashed token and returns family id", async () => {
    const family = await storeRefreshToken("user-1", "refresh-plain");
    expect(family).toMatch(/^[0-9a-f-]{36}$/i);
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        tokenHash: expect.any(String),
        familyId: family,
      })
    );
    const hash = insertValues.mock.calls[0]![0].tokenHash as string;
    expect(hash).not.toContain("refresh-plain");
    expect(hash).toHaveLength(64);
  });

  it("rotateRefreshToken returns null when old token missing", async () => {
    selectFrom.mockReturnValue({ where: vi.fn().mockResolvedValue([]) });
    const result = await rotateRefreshToken("old", "new", "user-1");
    expect(result).toBeNull();
  });

  it("rotateRefreshToken revokes old and stores new in same family", async () => {
    const existing = {
      id: "rt-1",
      userId: "user-1",
      familyId: "family-1",
      tokenHash: "x",
    };
    selectFrom.mockReturnValue({ where: vi.fn().mockResolvedValue([existing]) });
    const family = await rotateRefreshToken("old-token", "new-token", "user-1");
    expect(family).toBe("family-1");
    expect(updateSet).toHaveBeenCalled();
    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({ familyId: "family-1", userId: "user-1" })
    );
  });

  it("isRefreshTokenValid is false when no row", async () => {
    selectFrom.mockReturnValue({ where: vi.fn().mockResolvedValue([]) });
    await expect(isRefreshTokenValid("tok", "user-1")).resolves.toBe(false);
  });

  it("isRefreshTokenValid is true when row exists", async () => {
    selectFrom.mockReturnValue({ where: vi.fn().mockResolvedValue([{ id: "1" }]) });
    await expect(isRefreshTokenValid("tok", "user-1")).resolves.toBe(true);
  });

  it("revokeRefreshToken and revokeAllUserRefreshTokens update rows", async () => {
    await revokeRefreshToken("tok");
    await revokeAllUserRefreshTokens("user-1");
    expect(updateSet).toHaveBeenCalledTimes(2);
  });
});
