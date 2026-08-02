import { expect, test } from "@playwright/test";

test("非Composer画面ではInspectorを必要時だけ表示できる", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("AIの状況")).toBeVisible();

  await page.getByRole("tab", { name: /既存Promptを整える/ }).click();
  await expect(page.getByLabel("AIの状況")).not.toBeVisible();

  const showInspector = page.getByRole("button", { name: "AIの状況を表示" });
  await expect(showInspector).toHaveAttribute("aria-pressed", "false");
  await showInspector.click();
  await expect(page.getByLabel("AIの状況")).toBeVisible();
  await expect(page.getByRole("button", { name: "AIの状況を隠す" })).toHaveAttribute("aria-pressed", "true");
});
