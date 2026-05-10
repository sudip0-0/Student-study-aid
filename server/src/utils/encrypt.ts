import crypto from "crypto";

const encryptedPrefix = "v1";

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw Object.assign(new Error("Encryption service unavailable"), { statusCode: 500 });
  }

  const keyBuffer = Buffer.from(key, "hex");
  if (keyBuffer.length !== 32) {
    throw Object.assign(new Error("Encryption service unavailable"), { statusCode: 500 });
  }

  return keyBuffer;
}

export function encryptSecret(value: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    encryptedPrefix,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

export function decryptSecret(value: string): string {
  const [version, iv, authTag, encrypted] = value.split(":");
  if (version !== encryptedPrefix || !iv || !authTag || !encrypted) {
    throw Object.assign(new Error("API key must be re-saved before using AI features"), { statusCode: 400 });
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(iv, "base64url")
  );
  decipher.setAuthTag(Buffer.from(authTag, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
