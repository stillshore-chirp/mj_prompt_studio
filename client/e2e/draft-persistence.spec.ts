import { expect, test } from "@playwright/test";

test("keeps a dirty Composer draft when the user cancels tab navigation", async ({ page }) => {
  await page.goto("/");
  const subject = page.getByRole("textbox", { name: "Subject" });
  await subject.fill("safe draft fixture that must remain after cancel");
  await expect(page.getByText("未保存の変更", { exact: true })).toBeVisible();

  const tabs = page.getByRole("navigation", { name: "Main tabs" });
  await tabs.getByRole("button", { name: "Settings" }).click();

  await expect(page.getByRole("dialog", { name: "未保存の変更を保存しますか？" })).toBeVisible();
  await page.getByRole("button", { name: "キャンセル" }).click();
  await expect(page.getByRole("dialog", { name: "未保存の変更を保存しますか？" })).toBeHidden();
  await expect(subject).toHaveValue("safe draft fixture that must remain after cancel");
});

test("saves a dirty Composer draft before continuing to another tab", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Subject" }).fill("safe draft fixture saved before navigation");

  const tabs = page.getByRole("navigation", { name: "Main tabs" });
  await tabs.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("button", { name: "保存して続行" }).click();

  await expect(page.getByRole("region", { name: "Settings" })).toBeVisible();
  await expect(page.locator(".app-status")).toContainText("保存済み。続けて操作します。");
});
