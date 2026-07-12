import { test, expect } from "@playwright/test";

/**
 * Auth reload smoke: access token is memory-only; after full reload the httpOnly
 * refresh cookie must restore the session via /auth/refresh.
 * Requires a running API + seeded flow — skipped unless E2E_AUTH=1.
 */
test.describe("auth session recovery", () => {
  test.skip(!process.env.E2E_AUTH, "Set E2E_AUTH=1 with live API to run");

  test("reload recovers session from refresh cookie", async ({ page }) => {
    const email = process.env.E2E_EMAIL || "e2e@example.com";
    const password = process.env.E2E_PASSWORD || "Password123!";

    await page.goto("/login");
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/app/);

    await page.reload();
    await expect(page).toHaveURL(/\/app/);
    await expect(page.getByText("Lumio").first()).toBeVisible();
  });
});
