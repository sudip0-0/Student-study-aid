import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("public pages", () => {
  test("landing shows brand and CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Lumio").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /create free account|get started/i }).first()).toBeVisible();
  });

  test("login page has no critical a11y violations", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical).toEqual([]);
  });

  test("register page renders", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
  });
});
