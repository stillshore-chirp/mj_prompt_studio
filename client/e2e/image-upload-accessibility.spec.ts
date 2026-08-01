import { expect, test } from "@playwright/test";

test("opens both image pickers with the keyboard", async ({ page }) => {
  await page.goto("/");
  const tabs = page.getByRole("navigation", { name: "Main tabs" });

  await tabs.getByRole("tab", { name: "Reference Library" }).click();
  const referencePicker = page.getByLabel("Reference Library").locator("button.file-button");
  await referencePicker.focus();
  const referenceChooser = page.waitForEvent("filechooser");
  await referencePicker.press("Enter");
  await expect(await referenceChooser).toBeTruthy();
  await expect(page.getByRole("region", { name: "参照素材の画像をドロップして追加" })).toContainText("キーボードでは上の");

  await tabs.getByRole("tab", { name: "Result Review" }).click();
  const resultPicker = page.getByLabel("Result Review").locator("button.file-button");
  await resultPicker.focus();
  const resultChooser = page.waitForEvent("filechooser");
  await resultPicker.press("Enter");
  await expect(await resultChooser).toBeTruthy();
});
