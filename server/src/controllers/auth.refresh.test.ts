import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";

const { selectFrom, isValid, rotate, store, revoke } = vi.hoisted(() => ({
  selectFrom: vi.fn(),
  isValid: vi.fn(),
  rotate: vi.fn(),
  store: vi.fn(),
  revoke: vi.fn(),
}));

vi.mock("../db/index", () => ({
  db: {
    select: vi.fn(() => ({ from: selectFrom })),
    insert: vi.fn(() => ({ values: vi.fn().mockReturnValue({ returning: vi.fn() }) })),
  },
}));

vi.mock("../services/refreshToken.service", () => ({
  storeRefreshToken: (...args: unknown[]) => store(...args),
  rotateRefreshToken: (...args: unknown[]) => rotate(...args),
  revokeRefreshToken: (...args: unknown[]) => revoke(...args),
  isRefreshTokenValid: (...args: unknown[]) => isValid(...args),
}));

describe("auth.controller refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-jwt-secret-at-least-32-chars-long";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret-at-least-32-chars";
    process.env.NODE_ENV = "test";
  });

  function mockRes() {
    const res: {
      statusCode: number;
      body: unknown;
      cookie: ReturnType<typeof vi.fn>;
      clearCookie: ReturnType<typeof vi.fn>;
      status: (c: number) => unknown;
      json: (b: unknown) => unknown;
    } = {
      statusCode: 200,
      body: undefined,
      cookie: vi.fn(),
      clearCookie: vi.fn(),
      status(c: number) {
        res.statusCode = c;
        return res;
      },
      json(b: unknown) {
        res.body = b;
        return res;
      },
    };
    return res;
  }

  it("returns 400 when refresh cookie missing", async () => {
    const { refresh } = await import("../controllers/auth.controller");
    const req = { headers: {}, body: { refreshToken: "should-be-ignored" } } as Request;
    const res = mockRes();
    refresh(req, res as unknown as Response, vi.fn());
    await vi.waitFor(() => expect(res.body).toEqual({ error: "No refresh token" }));
    expect(res.statusCode).toBe(400);
  });

  it("returns 401 for invalid JWT cookie", async () => {
    const { refresh } = await import("../controllers/auth.controller");
    const req = { headers: { cookie: "refreshToken=not-valid" }, body: {} } as Request;
    const res = mockRes();
    refresh(req, res as unknown as Response, vi.fn());
    await vi.waitFor(() => expect(res.statusCode).toBe(401));
    expect(res.clearCookie).toHaveBeenCalled();
  });

  it("logout revokes cookie token", async () => {
    const { logout } = await import("../controllers/auth.controller");
    const req = { headers: { cookie: "refreshToken=abc" }, body: {} } as Request;
    const res = mockRes();
    logout(req, res as unknown as Response, vi.fn());
    await vi.waitFor(() => expect(res.body).toEqual({ message: "Logged out" }));
    expect(revoke).toHaveBeenCalledWith("abc");
    expect(res.clearCookie).toHaveBeenCalled();
  });

  it("rotates token when cookie valid", async () => {
    process.env.JWT_SECRET = "test-jwt-secret-at-least-32-chars-long";
    process.env.JWT_REFRESH_SECRET = "test-refresh-secret-at-least-32-chars";

    const token = jwt.sign(
      { sub: "user-1" },
      "test-refresh-secret-at-least-32-chars",
      { expiresIn: "7d" }
    );
    isValid.mockResolvedValue(true);
    rotate.mockResolvedValue("family-1");
    selectFrom.mockReturnValue({
      where: vi.fn().mockResolvedValue([
        { id: "user-1", email: "a@b.c", name: "A", apiKey: null, aiModel: "m", password: "x" },
      ]),
    });

    const { refresh } = await import("../controllers/auth.controller");
    const req = { headers: { cookie: `refreshToken=${token}` }, body: {} } as Request;
    const res = mockRes();
    const next = vi.fn((err?: unknown) => {
      if (err) throw err;
    });
    refresh(req, res as unknown as Response, next);
    await vi.waitFor(() => {
      expect(res.body).toBeDefined();
    });
    expect(res.body).toMatchObject({ message: "Token refreshed" });
    expect((res.body as { data: { accessToken: string } }).data.accessToken).toBeTruthy();
    expect(rotate).toHaveBeenCalled();
    expect(res.cookie).toHaveBeenCalled();
  });
});
