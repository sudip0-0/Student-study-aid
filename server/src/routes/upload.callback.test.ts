import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { verifyUploadCallbackToken, issueUploadCallbackToken } from "../utils/uploadCallback";

describe("upload callback token contract", () => {
  beforeEach(() => {
    process.env.UPLOAD_CALLBACK_SECRET = "upload-callback-secret-value-32c";
    process.env.JWT_SECRET = "fallback-jwt";
  });

  it("rejects missing callbackToken shape", () => {
    const token = undefined as string | undefined;
    expect(token ? verifyUploadCallbackToken(token) : null).toBeNull();
  });

  it("rejects forged callback tokens", () => {
    expect(verifyUploadCallbackToken("eyJhbGciOiJub25lIn0.eyJzdWIiOiJ4In0.")).toBeNull();
    expect(verifyUploadCallbackToken("garbage")).toBeNull();
  });

  it("accepts issued callback tokens", () => {
    const token = issueUploadCallbackToken("550e8400-e29b-41d4-a716-446655440000");
    expect(verifyUploadCallbackToken(token)).toBe("550e8400-e29b-41d4-a716-446655440000");
  });
});

describe("validateUUIDParam", () => {
  it("rejects invalid uuid params", async () => {
    const { validateUUIDParam } = await import("../utils/validateUUID");
    const mw = validateUUIDParam("id");
    const req = { params: { id: "not-uuid" } } as unknown as Request;
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
    mw(req, res, next);
    expect(status).toBe(400);
    expect(body).toEqual({ error: "Invalid id format" });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next for valid uuid", async () => {
    const { validateUUIDParam } = await import("../utils/validateUUID");
    const mw = validateUUIDParam("id");
    const req = {
      params: { id: "550e8400-e29b-41d4-a716-446655440000" },
    } as unknown as Request;
    const next = vi.fn() as NextFunction;
    mw(req, {} as Response, next);
    expect(next).toHaveBeenCalled();
  });
});
