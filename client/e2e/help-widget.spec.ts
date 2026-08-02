import { expect, test } from "@playwright/test";

test("右下ヘルプで文書の目次と現在画面の手順へ到達できる", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: /設定/ }).click();

  const trigger = page.getByRole("button", { name: "使い方", exact: true });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();

  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("region", { name: "使い方" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "最初に試す流れの目次" })).toBeVisible();
  await expect(page.getByRole("tabpanel", { name: "最初に試す流れ" })).toContainText("最初のプロンプトを作る");

  await page.getByRole("button", { name: "この画面の使い方へ" }).click();

  await expect(page.getByRole("tabpanel", { name: "最初に試す流れ" })).toContainText("AI接続を確認する");
  await page.getByRole("region", { name: "使い方" }).press("Escape");
  await expect(page.getByRole("region", { name: "使い方" })).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("Prompt Workshopのヘルプから、目的と使い分けを含むマニュアルを読める", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: /Prompt Workshop/ }).click();

  await page.getByRole("button", { name: "使い方", exact: true }).click();
  await page.getByRole("button", { name: "この画面の使い方へ" }).click();

  const manual = page.getByRole("tabpanel", { name: "ユーザーマニュアル" });
  await expect(manual).toContainText("Prompt Workshopは、材料なしで案を出す作業");
  await expect(manual).toContainText("比較する条件を管理したい場合はMatrix Lab");
});
