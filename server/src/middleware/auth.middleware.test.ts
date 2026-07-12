import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const selectFrom = vi.fn();

vi.mock("../db/index", () => ({
  db: {
    select: vi.fn(() => ({
      from: selectFrom,
    })),
  },
}));

describe("authMiddleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-jwt-secret-at-least-32-chars-long";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret-at-least-32-chars";
  });

  it("returns 401 when Authorization header missing", async () => {
    const { authMiddleware } = await import("./auth.middleware");
    const req = { headers: {} } as Request;
    let status = 0;
    let body: unknown;
    const res = {
      status: (c: number) => {
        status = c;
        return {
          json: (b: unknown) => {
            body = b;
          },
        };
      },
    } as unknown as Response;
    const next = vi.fn() as NextFunction;
    await authMiddleware(req as never, res, next);
    expect(status).toBe(401);
    expect(body).toEqual({ error: "No token provided" });
    expect(next).not.toHaveBeenCalled();
  });

  it("loads user and calls next for valid Bearer token", async () => {
    const { authMiddleware, generateTokens } = await import("./auth.middleware");
    const tokens = generateTokens("user-1");
    selectFrom.mockReturnValue({
      where: vi.fn().mockResolvedValue([
        { id: "user-1", email: "a@b.c", name: "A", apiKey: null, aiModel: "m" },
      ]),
    });

    const req = {
      headers: { authorization: `Bearer ${tokens.accessToken}` },
      user: undefined,
    } as never;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;
    await authMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect((req as { user?: { id: string } }).user?.id).toBe("user-1");
  });

  it("returns 401 for invalid JWT", async () => {
    const { authMiddleware } = await import("./auth.middleware");
    const req = {
      headers: { authorization: "Bearer not-a-valid-jwt" },
    } as Request;
    let status = 0;
    const res = {
      status: (c: number) => {
        status = c;
        return { json: () => undefined };
      },
    } as unknown as Response;
    await authMiddleware(req as never, res, vi.fn() as NextFunction);
    expect(status).toBe(401);
  });

  it("generateTokens signs with sub claim", () => {
    return import("./auth.middleware").then(({ generateTokens }) => {
      const { accessToken } = generateTokens("uid");
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!) as { sub: string };
      expect(decoded.sub).toBe("uid");
    });
  });
});
