import { expect, test } from "@playwright/test";

test("対象のない操作を止め、入力後に必要な操作だけ有効化する", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Compile", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "AI Brief から構造化" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "生成済みPromptをコピー" })).toBeDisabled();
  await expect(page.getByText("AI Briefを入力すると、構造化のjobを作成できます。")).toBeVisible();

  await page.getByRole("tab", { name: "Free Editor" }).click();
  await expect(page.getByRole("button", { name: "英語Prompt化" })).toBeDisabled();
  await expect(
    page.getByText("Japanese SourceまたはEnglish Promptを入力すると、変換できます。")
  ).toBeVisible();
  await page.getByLabel("English Prompt").fill("safe hotel breakfast campaign");
  await expect(page.getByRole("button", { name: "英語Prompt化" })).toBeEnabled();

  await page.getByRole("tab", { name: "Matrix Lab" }).click();
  await expect(page.getByRole("button", { name: "AI Plan" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Generate" })).toBeDisabled();
  await page.getByLabel("Objective").fill("safe campaign variations");
  await expect(page.getByRole("button", { name: "AI Plan" })).toBeEnabled();
  await page.getByRole("button", { name: "AI Plan" }).click();
  await expect(page.getByRole("button", { name: "Generate" })).toBeEnabled();

  await page.getByRole("tab", { name: "Composer" }).click();
  await page.getByLabel("AI Brief").fill("safe breakfast campaign brief");
  await expect(page.getByRole("button", { name: "Compile", exact: true })).toBeEnabled();
  await expect(page.getByRole("button", { name: "AI Brief から構造化" })).toBeEnabled();
});
