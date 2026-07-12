import { describe, expect, it } from "vitest";
import { validateBody } from "../middleware/validate";
import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

describe("validateBody", () => {
  it("passes parsed body to next", () => {
    const schema = z.object({ name: z.string().min(1) });
    const mw = validateBody(schema);
    const req = { body: { name: "Lumio" } } as Request;
    const res = { status: () => ({ json: () => undefined }) } as unknown as Response;
    let called = false;
    const next = (() => {
      called = true;
    }) as NextFunction;
    mw(req, res, next);
    expect(called).toBe(true);
    expect(req.body).toEqual({ name: "Lumio" });
  });

  it("rejects invalid body with 400", () => {
    const schema = z.object({ name: z.string().min(1) });
    const mw = validateBody(schema);
    const req = { body: { name: "" } } as Request;
    let statusCode = 0;
    let payload: unknown;
    const res = {
      status: (c: number) => {
        statusCode = c;
        return {
          json: (b: unknown) => {
            payload = b;
          },
        };
      },
    } as unknown as Response;
    let called = false;
    mw(req, res, (() => {
      called = true;
    }) as NextFunction);
    expect(called).toBe(false);
    expect(statusCode).toBe(400);
    expect(payload).toMatchObject({ error: expect.any(String) });
  });
});
