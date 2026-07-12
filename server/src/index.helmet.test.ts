import { describe, it, expect, vi } from "vitest";
import request from "supertest";

vi.mock("../db/index", () => ({
  db: {
    execute: vi.fn().mockResolvedValue([]),
    query: {},
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
  },
}));

vi.mock("../lib/redis", () => ({
  initRedis: vi.fn(),
  pingRedis: vi.fn().mockResolvedValue("not_configured"),
}));

vi.mock("../services/extractionJob.service", () => ({
  startExtractionWorker: vi.fn(),
}));

describe("helmet headers", () => {
  it("sets frameguard / referrer-policy on responses", async () => {
    const { app } = await import("./index");
    const res = await request(app).get("/api/metrics");
    expect(res.status).toBe(200);
    expect(res.headers["x-frame-options"]).toBe("DENY");
    expect(res.headers["referrer-policy"]).toBe("no-referrer");
  });
});
