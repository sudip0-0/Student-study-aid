import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";

vi.mock("../lib/redis", () => ({
  getRedis: vi.fn(() => null),
  isRedisConfigured: vi.fn(() => false),
}));

vi.mock("../lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn() },
}));

describe("rateLimitMiddleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = "test";
  });

  it("calls next when Redis is unavailable in non-production", async () => {
    const { rateLimitMiddleware } = await import("./rateLimit");
    const mw = rateLimitMiddleware("auth");
    const next = vi.fn() as NextFunction;
    await mw({ headers: {}, ip: "1.1.1.1" } as Request, {} as Response, next);
    expect(next).toHaveBeenCalled();
  });

  it("returns 503 for auth in production without Redis", async () => {
    process.env.NODE_ENV = "production";
    vi.resetModules();
    vi.doMock("../lib/redis", () => ({
      getRedis: vi.fn(() => null),
      isRedisConfigured: vi.fn(() => false),
    }));
    const { rateLimitMiddleware } = await import("./rateLimit");
    const mw = rateLimitMiddleware("auth");
    let status = 0;
    const res = {
      status: (c: number) => {
        status = c;
        return { json: () => undefined };
      },
    } as unknown as Response;
    await mw({ headers: {} } as Request, res, vi.fn() as NextFunction);
    expect(status).toBe(503);
  });
});
