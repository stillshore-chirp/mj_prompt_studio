import { expect, test } from "@playwright/test";

test("Composer shortcutは入力中に実行せず、入力欄以外では保存とCompileを実行できる", async ({ page }) => {
  await page.goto("/");

  const brief = page.getByLabel("AI Brief");
  await brief.fill("安全な朝食キャンペーンの制作意図");
  await brief.press("Alt+Shift+Enter");
  await expect(page.getByLabel("Compiled Prompt")).toContainText("未生成");
  await page.getByRole("textbox", { name: "Subject" }).fill("breakfast campaign with morning light");

  await page.getByRole("button", { name: "保存 (Alt+Shift+S)", exact: true }).focus();
  await page.keyboard.press("Alt+Shift+S");
  await expect(page.getByText("Composerの入力内容を保存しました。")).toBeVisible();

  await page.getByRole("button", { name: "Compile (Alt+Shift+Enter)", exact: true }).focus();
  await page.keyboard.press("Alt+Shift+Enter");
  await expect(page.getByLabel("Compiled Prompt")).toContainText("breakfast campaign with morning light");
  const copy = page.getByRole("button", { name: "コピー (Alt+Shift+C)", exact: true });
  await expect(copy).toBeEnabled();
  await copy.focus();
  await page.keyboard.press("Alt+Shift+C");
  await expect(
    page
      .getByText("Compiled Prompt をコピーしました。")
      .or(page.getByRole("dialog", { name: "手動でコピー" }))
  ).toBeVisible();
});
