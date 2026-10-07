import { test, expect } from "@playwright/test";

test("keeps builder usable from repository snapshot when Supabase SDK is unavailable", async ({ page }) => {
  await page.route("https://cdn.jsdelivr.net/**", route => route.fulfill({
    status: 200,
    contentType: "application/javascript",
    body: ""
  }));

  await page.goto("/");

  await expect(page.locator("#catalog-count")).toHaveText("65");
  await expect(page.locator("#sync-status")).toContainText(/referência|reference/i);
  await expect(page.locator("#generate-build")).toBeEnabled();

  await page.locator('[name="budget"]').fill("5000");
  await page.locator("#generate-build").click();
  await expect(page.locator("#build-result")).toBeVisible();
  await expect(page.locator("#compatibility-badge")).toHaveText(/Compatível|Compatible/);
});
