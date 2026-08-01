import { expect, test } from "@playwright/test";

test("Matrix variantをキーボードで選択し、空状態の出力は無効", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Matrix Lab" }).click();
  await expect(page.getByRole("button", { name: "CSV" })).toBeDisabled();
  await page.getByLabel("Objective").fill("safe matrix objective");
  await page.getByRole("button", { name: /AI Plan/ }).click();
  await page.getByRole("button", { name: "Generate" }).click();
  const row = page.locator("tbody tr").first();
  await row.focus();
  await row.press("Enter");
  await expect(page.getByText(/1件を選択中/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Selected" })).toBeEnabled();
});
