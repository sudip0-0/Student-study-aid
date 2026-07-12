import { describe, expect, it } from "vitest";
import { verifyUploadCallbackToken, issueUploadCallbackToken } from "./uploadCallback";

describe("uploadCallback tokens", () => {
  it("round-trips a signed callback token", () => {
    process.env.JWT_SECRET = "test-jwt-secret-for-upload-callback";
    process.env.UPLOAD_CALLBACK_SECRET = "upload-callback-secret-value";
    const token = issueUploadCallbackToken("550e8400-e29b-41d4-a716-446655440000");
    expect(verifyUploadCallbackToken(token)).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("rejects garbage tokens", () => {
    process.env.UPLOAD_CALLBACK_SECRET = "upload-callback-secret-value";
    expect(verifyUploadCallbackToken("not.a.jwt")).toBeNull();
  });
});
