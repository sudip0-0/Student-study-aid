process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-at-least-32-chars-long";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "test-refresh-secret-at-least-32-chars";
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "a".repeat(64);
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgres://user:pass@localhost:5432/test";
process.env.UPLOADTHING_SECRET = process.env.UPLOADTHING_SECRET || "sk_test_uploadthing_secret";
process.env.UPLOAD_CALLBACK_SECRET = process.env.UPLOAD_CALLBACK_SECRET || "upload-callback-secret-for-tests";
process.env.NODE_ENV = "test";
