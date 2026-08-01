import { expect, test } from "@playwright/test";

test("Main tabsと現在地を色だけに依存せず伝える", async ({ page }) => {
  await page.goto("/");

  const tabList = page.getByRole("tablist", { name: "Main tabs" });
  await expect(tabList.getByRole("tab", { name: "Composer" })).toHaveAttribute("aria-selected", "true");
  await expect(tabList.getByRole("tab", { name: "Composer" })).toHaveAttribute("aria-controls", "main-workspace");
  await expect(page.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", "main-tab-composer");
  await expect(page.getByRole("button", { name: "AI Brief", exact: true })).toHaveAttribute("aria-current", "page");

  await tabList.getByRole("tab", { name: "Composer" }).press("ArrowRight");
  await expect(tabList.getByRole("tab", { name: "Free Editor" })).toHaveAttribute("aria-selected", "true");
  await tabList.getByRole("tab", { name: "Free Editor" }).press("End");
  await expect(tabList.getByRole("tab", { name: "Settings" })).toHaveAttribute("aria-selected", "true");

  await tabList.getByRole("tab", { name: "Reference Library" }).click();
  await expect(tabList.getByRole("tab", { name: "Reference Library" })).toHaveAttribute("aria-selected", "true");
  await expect(tabList.getByRole("tab", { name: "Composer" })).toHaveAttribute("aria-selected", "false");
  await expect(page.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", "main-tab-reference-library");
  await expect(page.getByRole("button", { name: "References", exact: true })).toHaveAttribute("aria-current", "page");
});
