import { describe, expect, it, beforeAll } from "vitest";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = "a".repeat(64);
});

describe("encryptSecret / decryptSecret", () => {
  it("round-trips a secret", async () => {
    const { encryptSecret, decryptSecret } = await import("./encrypt");
    const plain = "sk-or-v1-test-key";
    const encrypted = encryptSecret(plain);
    expect(encrypted).toMatch(/^v1:/);
    expect(decryptSecret(encrypted)).toBe(plain);
  });

  it("rejects malformed ciphertext", async () => {
    const { decryptSecret } = await import("./encrypt");
    expect(() => decryptSecret("not-valid")).toThrow();
  });
});
