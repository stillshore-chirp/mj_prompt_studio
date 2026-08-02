import { expect, test } from "@playwright/test";

test("Prompt Workshopはゼロ入力生成と既存Promptの整形をJobとして実行する", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: /Prompt Workshop/ }).click();

  await expect(page.getByRole("button", { name: "Prompt案を生成" })).toBeEnabled();
  await page.getByRole("button", { name: "Prompt案を生成" }).click();
  await expect(page.getByRole("heading", { name: "生成結果" })).toBeVisible();
  await expect(page.getByText("生成 10 / 指定 10")).toBeVisible();
  await expect(page.getByRole("contentinfo").getByText("Prompt案の生成が完了しました。結果は対象画面で確認できます。")).toBeVisible();

  await page.getByLabel("作業中のPrompt").fill("paper sculpture in soft light --ar 4:5");
  await expect(page.getByRole("button", { name: "世界観整形" })).toBeEnabled();
  await page.getByRole("button", { name: "世界観整形" }).click();
  await expect(page.getByRole("heading", { name: "世界観整形" })).toBeVisible();
  await expect(page.getByLabel("世界観整形")).toContainText("paper sculpture");
});
