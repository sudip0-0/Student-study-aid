import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;
const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || (isCI ? baseURL : "http://localhost:5173"),
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: isCI ? "pnpm exec vite preview --host 127.0.0.1 --port 4173" : "pnpm --filter client dev",
    cwd: isCI ? "." : "..",
    url: isCI ? "http://127.0.0.1:4173" : "http://localhost:5173",
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
