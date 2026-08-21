import { expect, test } from "@playwright/test";

test("workspace shell renders the canvas and sidebar", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("workspace-shell")).toBeVisible();
  await expect(page.getByTestId("workspace-title")).toHaveText("Zenith Workspace");
  await expect(page.getByTestId("canvas-board")).toBeVisible();
  await expect(page.getByTestId("milestones")).toBeVisible();
});

test("control deck opens from the sidebar", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("control-deck-open").click();
  await expect(page.getByTestId("control-deck")).toBeVisible();
  await expect(page.getByText("Zenith Control Deck")).toBeVisible();
  await expect(page.getByTestId("control-tab-appearance")).toBeVisible();
});

test("daily check-in increments the streak counter", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("streak-count")).toContainText("3 Days Active");
  await page.getByTestId("streak-check-in").click();
  await expect(page.getByTestId("streak-count")).toContainText("4 Days Active");
});

test("blueprint stack modal shows the runtime pipeline", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("blueprint-open").click();
  await expect(page.getByTestId("architecture-blueprint")).toBeVisible();
  await expect(page.getByText("Interactive System Architecture Blueprint")).toBeVisible();
});

test("fresh start confirm restores a starter board", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("control-deck-open").click();
  await page.getByTestId("control-tab-automations").click();
  await page.getByTestId("fresh-start").click();
  await expect(page.getByTestId("confirm-dialog")).toBeVisible();
  await page.getByTestId("confirm-yes").click();
  await expect(page.getByText("Welcome to Zenith Canvas!")).toBeVisible();
});
