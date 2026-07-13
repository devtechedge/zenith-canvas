import { test, expect } from "@playwright/test";

test("loads the workspace shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Zenith Canvas")).toBeVisible();
  await expect(page.getByRole("button", { name: /Family Groceries/ })).toBeVisible();
});
