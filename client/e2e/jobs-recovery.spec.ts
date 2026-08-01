import { expect, test } from "@playwright/test";

test("対応対象を先に表示し、キーボードで履歴と詳細を確認できる", async ({ page }) => {
  await page.route("**/api/jobs", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        jobs: [
          ...Array.from({ length: 7 }, (_, index) => job(`completed_${index}`, "succeeded")),
          job("cancelled", "cancelled"),
          job("failed", "failed", "PromptDoctorAgent"),
          job("queued", "queued"),
          job("running", "running")
        ]
      })
    });
  });

  await page.goto("/");
  const jobs = page.getByLabel("AI処理");
  await expect(jobs.getByRole("button", { name: "対応対象 4" })).toHaveAttribute("aria-pressed", "true");
  await expect(jobs.getByRole("article")).toHaveCount(4);
  await expect(jobs.getByRole("article").first()).toHaveAccessibleName(/実行中/);

  const completedFilter = jobs.getByRole("button", { name: "完了 7" });
  await completedFilter.focus();
  await page.keyboard.press("Enter");
  await expect(completedFilter).toHaveAttribute("aria-pressed", "true");
  await expect(jobs.getByRole("article")).toHaveCount(5);
  await expect(jobs.getByRole("button", { name: "完了済みをあと2件表示" })).toBeVisible();

  await jobs.getByRole("button", { name: "失敗 1" }).click();
  const failedJob = jobs.getByRole("article", { name: /Prompt Doctorの確認 失敗/ });
  await failedJob.getByRole("button", { name: "詳細を表示" }).click();
  await expect(failedJob.getByText("対象")).toBeVisible();
  await expect(failedJob.getByText("現在のPrompt文書")).toBeVisible();
  await expect(failedJob.getByText("internal provider trace must not be shown")).toBeHidden();
  await expect(failedJob.getByRole("button", { name: "再試行する" })).toBeVisible();
});

function job(id: string, status: "queued" | "running" | "succeeded" | "failed" | "cancelled", agentName = "VocabularyAgent") {
  return {
    id,
    agent_name: agentName,
    model: "gpt-5.6-luna",
    reasoning_effort: "high",
    text_verbosity: "low",
    status,
    input_snapshot: {},
    output_json: status === "succeeded" ? {} : null,
    error_message: status === "failed" ? "internal provider trace must not be shown" : null,
    created_at: "2026-08-01T00:00:00Z",
    finished_at: status === "queued" || status === "running" ? null : "2026-08-01T00:00:01Z",
    retry_count: 0
  };
}
