import { describe, expect, it, vi } from "vitest";
import { isUUID, validateUUIDParam } from "./validateUUID";
import type { Request, Response, NextFunction } from "express";

describe("isUUID", () => {
  it("accepts valid UUIDs", () => {
    expect(isUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("rejects non-UUIDs", () => {
    expect(isUUID("not-a-uuid")).toBe(false);
    expect(isUUID("")).toBe(false);
  });
});

describe("validateUUIDParam", () => {
  it("allows missing optional empty params", () => {
    const mw = validateUUIDParam("id");
    const next = vi.fn() as NextFunction;
    mw({ params: {} } as unknown as Request, {} as Response, next);
    expect(next).toHaveBeenCalled();
  });
});
