import { expect, test } from "@playwright/test";

test("workspace shell renders the canvas and sidebar", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("workspace-shell")).toBeVisible();
  await expect(page.getByTestId("workspace-title")).toHaveText("Zenith Workspace");
  await expect(page.getByTestId("canvas-board")).toBeVisible();
  await expect(page.getByRole("button", { name: "Control Deck" })).toBeVisible();
  await expect(page.getByText("Try this")).toBeVisible();
});

test("control deck opens from the sidebar", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("control-deck-open").click();
  await expect(page.getByTestId("control-deck")).toBeVisible();
  await expect(page.getByText("Zenith Control Deck")).toBeVisible();
  await expect(page.getByTestId("control-tab-appearance")).toBeVisible();
});

test("checking off a task is the first action", async ({ page }) => {
  await page.goto("/");
  const box = page.getByTestId("checklist-toggle-todo-try-me");
  await expect(box).toBeVisible();
  await expect(box).not.toBeChecked();
  await box.click();
  await expect(box).toBeChecked();
});

test("home cards load at equal size", async ({ page }) => {
  await page.goto("/");
  const cards = page.getByTestId("canvas-card");
  await expect(cards).toHaveCount(7);
  const boxes = await cards.all();
  const first = await boxes[0].boundingBox();
  expect(first).toBeTruthy();
  for (const card of boxes) {
    const box = await card.boundingBox();
    expect(Math.abs((box?.width ?? 0) - first!.width)).toBeLessThan(2);
    expect(Math.abs((box?.height ?? 0) - first!.height)).toBeLessThan(2);
  }
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
