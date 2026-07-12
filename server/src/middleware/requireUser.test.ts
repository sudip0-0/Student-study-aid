import { describe, expect, it } from "vitest";
import { requireUser } from "./requireUser";
import type { AuthRequest } from "./auth.middleware";
import type { Response } from "express";

describe("requireUser", () => {
  it("returns user when present", () => {
    const req = {
      user: { id: "u1", email: "a@b.c", name: "A", hasApiKey: false, aiModel: "m" },
    } as AuthRequest;
    const res = { status: () => ({ json: () => undefined }) } as unknown as Response;
    expect(requireUser(req, res)?.id).toBe("u1");
  });

  it("sends 401 when missing", () => {
    const req = {} as AuthRequest;
    let status = 0;
    const res = {
      status: (c: number) => {
        status = c;
        return { json: () => undefined };
      },
    } as unknown as Response;
    expect(requireUser(req, res)).toBeNull();
    expect(status).toBe(401);
  });
});
