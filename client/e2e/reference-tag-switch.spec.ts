import { expect, test } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const pngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAwAAAAICAIAAADN5B7xAAAAGUlEQVR4nGP8z8AARLJgwi1GqGkY1TAAAM6pAqzH/2GfAAAAAElFTkSuQmCC";

test("未保存の参照タグは素材切替前に確認する", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: /参考画像を使う/ }).click();
  const firstImage = writeImage("first-safe-reference.png");
  const secondImage = writeImage("second-safe-reference.png");
  const fileInput = page.getByLabel("Reference Library").locator('input[type="file"]');

  await fileInput.setInputFiles(firstImage);
  await fileInput.setInputFiles(secondImage);
  const referenceItems = page.getByLabel("Reference Library").locator(".asset-list-item");
  await expect(referenceItems.nth(1)).toBeVisible();
  await referenceItems.nth(1).click();
  await page.getByRole("textbox", { name: "Tags" }).fill("draft-only-safe-tag");
  await referenceItems.nth(0).click();
  await expect(page.getByRole("dialog", { name: "未保存のタグを破棄しますか？" })).toBeVisible();
  await page.getByRole("button", { name: "破棄して切り替える" }).click();
  await expect(page.getByRole("textbox", { name: "Tags" })).not.toHaveValue("draft-only-safe-tag");
});

function writeImage(filename: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mjps-e2e-reference-tags-"));
  const imagePath = path.join(dir, filename);
  fs.writeFileSync(imagePath, Buffer.from(pngBase64, "base64"));
  return imagePath;
}
