import { expect, test } from "@playwright/test";

test("explains mock mode and confirms Privacy mode before changing it", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Main tabs" }).getByRole("button", { name: "Settings" }).click();

  await expect(page.getByRole("region", { name: "Settings" })).toBeVisible();
  await expect(page.getByLabel("OpenAI API key")).toBeVisible();
  await expect(page.getByRole("button", { name: "このセッションだけで使用" })).toBeDisabled();
  await expect(page.getByText("Mock LLMモードです。外部APIへの接続・送信は行わず、接続テストは無効です。")).toBeVisible();
  await expect(page.getByRole("button", { name: "実APIへの接続をテスト" })).toBeDisabled();

  const privacySwitch = page.getByRole("checkbox", { name: "Privacy modeを有効にする" });
  const initialPrivacyMode = await privacySwitch.isChecked();
  await privacySwitch.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("キャンセルすると設定は変更されません。")).toBeVisible();
  await page.getByRole("button", { name: "キャンセル" }).click();
  expect(await privacySwitch.isChecked()).toBe(initialPrivacyMode);
});
