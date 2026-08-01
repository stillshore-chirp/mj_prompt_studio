import { expect, test } from "@playwright/test";

test("文字を125%相当に拡大しても主作業と補助情報へ到達できる", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/");
  await page.locator("html").evaluate((element) => {
    element.style.fontSize = "20px";
  });

  await expect(page.getByRole("textbox", { name: "Subject" })).toBeVisible();
  await page.getByRole("tab", { name: "Settings" }).click();
  await expect(page.getByRole("region", { name: "Settings" })).toBeVisible();

  await page.getByRole("button", { name: "AIの状況を表示" }).click();
  await page.getByRole("region", { name: "AIの状況" }).scrollIntoViewIfNeeded();
  await expect(page.getByRole("region", { name: "AIの状況" })).toBeVisible();
  expect(await page.locator("html").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
});
