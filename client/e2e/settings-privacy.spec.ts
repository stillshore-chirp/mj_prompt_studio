import { expect, test } from "@playwright/test";

test("explains mock mode and confirms Privacy mode before changing it", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Main tabs" }).getByRole("tab", { name: "Settings" }).click();

  const settings = page.getByRole("region", { name: "Settings" });
  await expect(settings).toBeVisible();
  await expect(settings.getByLabel("OpenAI API key")).toBeVisible();
  await expect(settings.getByRole("button", { name: "OS資格情報ストアから読み込んで使用" })).toBeVisible();
  await expect(settings.getByRole("button", { name: "このセッションだけで使用" })).toBeDisabled();
  await expect(settings.getByText("Mock LLMモードです。外部APIへの接続・送信は行わず、接続テストは無効です。")).toBeVisible();
  await expect(settings.getByRole("button", { name: "実APIへの接続をテスト" })).toBeDisabled();

  await settings.getByRole("button", { name: "OS資格情報ストアから読み込んで使用" }).click();
  await expect(
    settings.getByText("保存済みのAPI keyが見つからないか、OS資格情報ストアを利用できません。設定は変更していません。")
  ).toBeVisible();

  const privacySwitch = page.getByRole("checkbox", { name: "Privacy modeを有効にする" });
  const initialPrivacyMode = await privacySwitch.isChecked();
  await privacySwitch.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("キャンセルすると設定は変更されません。")).toBeVisible();
  await page.getByRole("button", { name: "キャンセル" }).click();
  expect(await privacySwitch.isChecked()).toBe(initialPrivacyMode);
});
