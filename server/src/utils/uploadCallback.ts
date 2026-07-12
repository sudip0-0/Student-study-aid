import jwt from "jsonwebtoken";

function callbackSecret(): string {
  return process.env.UPLOAD_CALLBACK_SECRET || process.env.JWT_SECRET || "";
}

export function issueUploadCallbackToken(userId: string): string {
  return jwt.sign({ sub: userId, purpose: "upload_callback" }, callbackSecret(), { expiresIn: "15m" });
}

export function verifyUploadCallbackToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, callbackSecret()) as { sub?: string; purpose?: string };
    if (decoded.purpose !== "upload_callback" || !decoded.sub) return null;
    return decoded.sub;
  } catch {
    return null;
  }
}
