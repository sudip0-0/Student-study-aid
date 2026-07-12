import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";

const limitFn = vi.fn();

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class MockRatelimit {
    static slidingWindow = vi.fn(() => "window");
    limit = limitFn;
    constructor(_opts: unknown) {}
  },
}));

vi.mock("../lib/redis", () => ({
  getRedis: vi.fn(() => ({ ping: vi.fn() })),
  isRedisConfigured: vi.fn(() => true),
}));

vi.mock("../lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn() },
}));

describe("rateLimitMiddleware with Redis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.NODE_ENV = "test";
    limitFn.mockResolvedValue({ success: true, limit: 20, remaining: 19 });
  });

  it("allows request when under limit", async () => {
    const { rateLimitMiddleware } = await import("./rateLimit");
    const mw = rateLimitMiddleware("ai");
    const headers: Record<string, string> = {};
    const res = {
      setHeader: (k: string, v: string) => {
        headers[k] = v;
      },
    } as unknown as Response;
    const next = vi.fn() as NextFunction;
    await mw({ headers: {}, ip: "9.9.9.9" } as Request, res, next);
    expect(next).toHaveBeenCalled();
    expect(headers["X-RateLimit-Limit"]).toBe("20");
  });

  it("returns 429 when limited", async () => {
    limitFn.mockResolvedValue({ success: false, limit: 20, remaining: 0 });
    const { rateLimitMiddleware } = await import("./rateLimit");
    const mw = rateLimitMiddleware("upload");
    let status = 0;
    const res = {
      setHeader: vi.fn(),
      status: (c: number) => {
        status = c;
        return { json: () => undefined };
      },
    } as unknown as Response;
    await mw({ headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } } as Request, res, vi.fn() as NextFunction);
    expect(status).toBe(429);
  });
});
