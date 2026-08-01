import { expect, type Page, test } from "@playwright/test";

test("sends one auto-suggestion Job for one user edit", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByLabel("Composer")).toBeVisible();

  const jobsBefore = await autoSuggestionJobCount(page);
  await page
    .getByRole("textbox", { name: "Subject" })
    .fill("safe fixture text for UI verification only");

  await expect.poll(() => autoSuggestionJobCount(page)).toBe(jobsBefore + 1);
  await page.waitForTimeout(2_200);
  await expect.poll(() => autoSuggestionJobCount(page)).toBe(jobsBefore + 1);
  await expect(page.locator(".assist-status")).toContainText(
    "最新の入力への提案を確認できます。提案は自動適用されません。"
  );
});

async function autoSuggestionJobCount(page: Page): Promise<number> {
  return page.evaluate(async () => {
    const response = await fetch("/api/jobs");
    const payload = (await response.json()) as {
      jobs: { agent_name: string; input_snapshot: { mode?: string } }[];
    };
    return payload.jobs.filter(
      (job) => job.agent_name === "VocabularyAgent" && job.input_snapshot.mode === "auto"
    ).length;
  });
}
