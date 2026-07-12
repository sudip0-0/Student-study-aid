import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: [
        "src/middleware/**",
        "src/controllers/auth.controller.ts",
        "src/controllers/settings.controller.ts",
        "src/services/file.service.ts",
        "src/utils/encrypt.ts",
        "src/utils/validateUUID.ts",
        "src/routes/upload.routes.ts",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        statements: 70,
      },
    },
  },
});
