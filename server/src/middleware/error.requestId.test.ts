import { describe, expect, it, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { errorMiddleware } from "./error.middleware";
import { requestIdMiddleware } from "./requestId";

vi.mock("../lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn() },
}));

describe("errorMiddleware", () => {
  it("masks 500 messages when not exposed", () => {
    const err = Object.assign(new Error("secret db detail"), { statusCode: 500 });
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
    errorMiddleware(err, { requestId: "r1" } as Request, res, vi.fn() as NextFunction);
    expect(status).toBe(500);
    expect(body).toEqual({ error: "Internal server error" });
  });

  it("exposes client errors", () => {
    const err = Object.assign(new Error("bad input"), { statusCode: 400, expose: true });
    let body: unknown;
    const res = {
      status: () => ({
        json: (b: unknown) => {
          body = b;
        },
      }),
    } as unknown as Response;
    errorMiddleware(err, {} as Request, res, vi.fn() as NextFunction);
    expect(body).toEqual({ error: "bad input" });
  });
});

describe("requestIdMiddleware", () => {
  it("sets x-request-id header", () => {
    const req = { headers: {} } as Request;
    const headers: Record<string, string> = {};
    const res = {
      setHeader: (k: string, v: string) => {
        headers[k] = v;
      },
    } as unknown as Response;
    const next = vi.fn() as NextFunction;
    requestIdMiddleware(req, res, next);
    expect(headers["x-request-id"]).toBeTruthy();
    expect(req.requestId).toBe(headers["x-request-id"]);
    expect(next).toHaveBeenCalled();
  });

  it("reuses incoming x-request-id", () => {
    const req = { headers: { "x-request-id": "incoming-id" } } as unknown as Request;
    const headers: Record<string, string> = {};
    const res = {
      setHeader: (k: string, v: string) => {
        headers[k] = v;
      },
    } as unknown as Response;
    requestIdMiddleware(req, res, vi.fn() as NextFunction);
    expect(headers["x-request-id"]).toBe("incoming-id");
  });
});
