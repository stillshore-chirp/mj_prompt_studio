import { expect, test } from "@playwright/test";

test("explains mock mode and confirms Privacy mode before changing it", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Main tabs" }).getByRole("tab", { name: /設定/ }).click();

  const settings = page.getByRole("region", { name: "Settings" });
  await expect(settings).toBeVisible();
  await expect(settings.getByLabel("OpenAI API key")).toBeVisible();
  await expect(settings.getByRole("button", { name: "OS資格情報ストアから読み込んで使用" })).toBeVisible();
  await expect(settings.getByRole("button", { name: "このセッションだけで使用" })).toBeDisabled();
  await expect(
    settings.getByText("Mockモードは明示設定されています。外部APIへの接続・送信は行わず、接続テストは実行しません。")
  ).toBeVisible();
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

test("API key未設定でAI処理を実行すると、設定への回復導線を表示する", async ({ page }) => {
  await page.route("**/api/agents/intent-intake", async (route) => {
    await route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({
        detail: {
          code: "api_key_missing",
          message: "AIを実行するにはAPI keyの設定が必要です。"
        }
      })
    });
  });
  await page.goto("/");

  await page.getByRole("textbox", { name: "AI Brief" }).fill("safe fixture");
  await page.getByRole("button", { name: "AI Brief から構造化" }).click();
  await expect(page.getByRole("button", { name: "設定を開く" })).toBeVisible();

  await page.getByRole("button", { name: "設定を開く" }).click();
  await expect(page.getByRole("dialog", { name: "未保存の変更を保存しますか？" })).toBeVisible();
  await page.getByRole("button", { name: "保存して続行" }).click();
  await expect(page.getByRole("heading", { name: /AI支援の設定を確認する/ })).toBeVisible();
});
