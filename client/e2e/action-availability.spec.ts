import { expect, test } from "@playwright/test";

test("対象のない操作を止め、入力後に必要な操作だけ有効化する", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Compile (Alt+Shift+Enter)", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "AI Brief から構造化" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "コピー (Alt+Shift+C)" })).toBeDisabled();
  await expect(page.getByText("AI Briefを入力すると、構造化のjobを作成できます。")).toBeVisible();

  await page.getByRole("tab", { name: /Prompt Workshop/ }).click();
  await expect(page.getByRole("button", { name: "英語Prompt化" })).toBeDisabled();
  await expect(
    page.getByText("文字数のみ調整は除外語句を適用せず、意味保持を優先します。その他の創作系操作にはSettingsの除外語句が適用されます。")
  ).toBeVisible();
  await page.getByLabel("作業中のPrompt").fill("safe hotel breakfast campaign");
  await expect(page.getByRole("button", { name: "英語Prompt化" })).toBeEnabled();

  await page.getByRole("tab", { name: /複数案を比較する/ }).click();
  await expect(page.getByRole("button", { name: "AI Plan" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Generate" })).toBeDisabled();
  await page.getByLabel("Objective").fill("safe campaign variations");
  await expect(page.getByRole("button", { name: "AI Plan" })).toBeEnabled();
  await page.getByRole("button", { name: "AI Plan" }).click();
  await expect(page.getByRole("button", { name: "Generate" })).toBeEnabled();

  await page.getByRole("tab", { name: /プロンプトを作る/ }).click();
  await page.getByLabel("AI Brief").fill("safe breakfast campaign brief");
  await expect(page.getByRole("button", { name: "Compile (Alt+Shift+Enter)", exact: true })).toBeEnabled();
  await expect(page.getByRole("button", { name: "AI Brief から構造化" })).toBeEnabled();
});
