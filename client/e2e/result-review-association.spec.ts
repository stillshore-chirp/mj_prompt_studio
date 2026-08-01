import { expect, test } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const pngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAwAAAAICAIAAADN5B7xAAAAGUlEQVR4nGP8z8AARLJgwi1GqGkY1TAAAM6pAqzH/2GfAAAAAElFTkSuQmCC";

test("選択中でない画像のAI Reviewを表示しない", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Result Review" }).click();
  const firstImage = writeImage("first-safe.png");
  const secondImage = writeImage("second-safe.png");

  await page.getByLabel("Result Review").locator('input[type="file"]').setInputFiles(firstImage);
  await page.getByRole("button", { name: "選択中の結果画像を AI Review" }).click();
  await expect(page.getByText(/全体に高品質/)).toBeVisible();

  await page.getByLabel("Result Review").locator('input[type="file"]').setInputFiles(secondImage);
  const resultItems = page.getByLabel("Result Review").locator(".asset-list-item");
  await expect(resultItems.nth(1)).toBeVisible();
  await resultItems.nth(1).click();
  await expect(page.getByText(/全体に高品質/)).toBeVisible();
  await resultItems.nth(0).click();
  const unrelatedParameterDialog = page.getByRole("dialog", { name: "パラメータを適用しますか？" });
  if (await unrelatedParameterDialog.isVisible()) {
    await unrelatedParameterDialog.getByRole("button", { name: "キャンセル" }).click();
  }
  await expect(page.getByText(/この画像には保存済みのAI Reviewがありません/)).toBeVisible();
  await expect(page.getByText(/全体に高品質/)).not.toBeVisible();
});

function writeImage(filename: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mjps-e2e-result-review-"));
  const imagePath = path.join(dir, filename);
  fs.writeFileSync(imagePath, Buffer.from(pngBase64, "base64"));
  return imagePath;
}
