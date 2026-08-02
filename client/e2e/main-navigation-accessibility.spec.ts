import { expect, test } from "@playwright/test";

test("Main tabsと現在地を色だけに依存せず伝える", async ({ page }) => {
  await page.goto("/");

  const tabList = page.getByRole("tablist", { name: "Main tabs" });
  await expect(tabList.getByRole("tab", { name: /プロンプトを作る/ })).toHaveAttribute("aria-selected", "true");
  await expect(tabList.getByRole("tab", { name: /プロンプトを作る/ })).toHaveAttribute("aria-controls", "main-workspace");
  await expect(page.locator("#main-workspace")).toHaveAttribute("aria-labelledby", "main-tab-composer");
  await expect(page.getByRole("button", { name: /1\. プロンプトを作る/ })).toHaveAttribute("aria-current", "page");

  await tabList.getByRole("tab", { name: /プロンプトを作る/ }).press("ArrowRight");
  await expect(tabList.getByRole("tab", { name: /既存Promptを整える/ })).toHaveAttribute("aria-selected", "true");
  await tabList.getByRole("tab", { name: /既存Promptを整える/ }).press("End");
  await expect(tabList.getByRole("tab", { name: /設定/ })).toHaveAttribute("aria-selected", "true");

  await tabList.getByRole("tab", { name: /参考画像を使う/ }).click();
  await expect(tabList.getByRole("tab", { name: /参考画像を使う/ })).toHaveAttribute("aria-selected", "true");
  await expect(tabList.getByRole("tab", { name: /プロンプトを作る/ })).toHaveAttribute("aria-selected", "false");
  await expect(page.locator("#main-workspace")).toHaveAttribute("aria-labelledby", "main-tab-reference-library");
  await expect(page.getByRole("button", { name: /3\. 参考画像を使う/ })).toHaveAttribute("aria-current", "page");
});
