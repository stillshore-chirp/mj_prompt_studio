import { expect, test } from "@playwright/test";

test("760px幅でも主作業と補助パネルへ到達でき、横overflowを作らない", async ({ page }) => {
  await page.setViewportSize({ width: 760, height: 820 });
  await page.goto("/");
  const main = page.locator(".main-panel");
  await expect(main).toBeVisible();
  expect(await main.evaluate((element) => element.clientHeight)).toBeGreaterThanOrEqual(460);
  await expect(page.getByRole("textbox", { name: "Subject" })).toBeVisible();
  await page.getByRole("tab", { name: "Settings" }).click();
  await expect(page.getByRole("region", { name: "Settings" })).toBeVisible();
  await page.getByRole("button", { name: "AIの状況を表示" }).click();
  await page.getByRole("region", { name: "AIの状況" }).scrollIntoViewIfNeeded();
  await expect(page.getByRole("region", { name: "AIの状況" })).toBeVisible();
  await page.getByRole("region", { name: "AI処理" }).scrollIntoViewIfNeeded();
  await expect(page.getByRole("region", { name: "AI処理" })).toBeVisible();
  expect(await page.locator("html").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
});
