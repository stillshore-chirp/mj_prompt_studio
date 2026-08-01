import { expect, test } from "@playwright/test";

test("keeps Patch confirmation keyboard focus inside the dialog and restores it on Escape", async ({
  page
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Run Prompt Doctor" }).click();

  const patch = page.getByRole("button", { name: /構図の比較軸/ });
  await expect(patch).toBeVisible();
  await patch.click();

  const dialog = page.getByRole("dialog", { name: "変更を適用しますか？" });
  const cancel = page.getByRole("button", { name: "キャンセル" });
  const confirm = page.getByRole("button", { name: "変更を適用" });
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await expect(cancel).toBeFocused();

  await page.keyboard.press("Shift+Tab");
  await expect(confirm).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(cancel).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(patch).toBeFocused();
});
