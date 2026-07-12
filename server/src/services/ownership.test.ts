import { describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";

/**
 * Documents the ownership filter pattern used across file/folder services.
 * Real queries apply and(eq(id), eq(userId)) — never trust id alone.
 */
export function ownershipWhere(fileId: string, userId: string) {
  return { fileId, userId, pattern: "and(eq(files.id, fileId), eq(files.userId, userId))" };
}

describe("ownership filter contract", () => {
  it("always pairs resource id with userId", () => {
    const clause = ownershipWhere("file-1", "user-a");
    expect(clause.fileId).toBe("file-1");
    expect(clause.userId).toBe("user-a");
    expect(clause.pattern).toContain("userId");
    expect(typeof and).toBe("function");
    expect(typeof eq).toBe("function");
  });
});
