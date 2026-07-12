import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/middleware/auth.middleware.ts",
        "src/middleware/error.middleware.ts",
        "src/middleware/rateLimit.ts",
        "src/middleware/requestId.ts",
        "src/middleware/requireUser.ts",
        "src/middleware/validate.ts",
        "src/utils/encrypt.ts",
        "src/utils/validateUUID.ts",
        "src/utils/escapeLike.ts",
        "src/utils/uploadCallback.ts",
        "src/services/refreshToken.service.ts",
        "src/controllers/auth.controller.ts",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        statements: 70,
      },
    },
  },
});
