import { describe, expect, it } from "vitest";
import { isUUID } from "./validateUUID";

describe("isUUID", () => {
  it("accepts valid UUIDs", () => {
    expect(isUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("rejects non-UUIDs", () => {
    expect(isUUID("not-a-uuid")).toBe(false);
    expect(isUUID("")).toBe(false);
  });
});
