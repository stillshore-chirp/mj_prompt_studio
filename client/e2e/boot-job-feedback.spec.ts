import { expect, test } from "@playwright/test";

test("shows an actionable, safe recovery screen when workspace loading fails", async ({ page }) => {
  await page.route("**/api/workspace", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ detail: "internal server trace must not be exposed" })
    });
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "起動できませんでした" })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveText(
    "ローカルAPIがこの処理を完了できませんでした。内容は変更されていません。再試行してください。"
  );
  await expect(page.getByText("プロジェクトと保存済みの内容はまだ読み込まれていません。")).toBeVisible();
  await expect(page.getByRole("button", { name: "再試行する" })).toBeVisible();
  await expect(page.getByRole("button", { name: "接続設定を確認する" })).toBeVisible();
  await expect(page.getByText("internal server trace must not be exposed")).toBeHidden();
});

test("shows a failed Job's state, impact, and retry path without backend error detail", async ({
  page
}) => {
  await page.route("**/api/jobs", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        jobs: [
          {
            id: "job_safe_failed_fixture",
            agent_name: "PromptDoctorAgent",
            model: "gpt-5.6-luna",
            reasoning_effort: "high",
            text_verbosity: "low",
            status: "failed",
            input_snapshot: {},
            output_json: null,
            error_message: "internal provider trace must not be exposed",
            created_at: "2026-08-01T00:00:00Z",
            finished_at: "2026-08-01T00:00:01Z",
            retry_count: 0
          }
        ]
      })
    });
  });

  await page.goto("/");
  const job = page.getByRole("article").filter({ hasText: "PromptDoctorAgent" });
  await expect(job).toContainText("失敗");
  await expect(job).toContainText(
    "この処理を完了できませんでした。結果は適用されていません。入力や接続設定を確認して、再試行してください。"
  );
  await expect(job.getByRole("button", { name: "PromptDoctorAgentの処理を再試行する" })).toBeVisible();
  await expect(page.getByText("internal provider trace must not be exposed")).toBeHidden();
});
