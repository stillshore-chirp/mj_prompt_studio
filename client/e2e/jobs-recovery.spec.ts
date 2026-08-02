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
  await expect(failedJob.getByText("APIリクエスト")).toBeVisible();
  await expect(failedJob.getByText("503")).toBeVisible();
  await expect(failedJob.getByRole("button", { name: "診断情報をコピー" })).toBeVisible();
});

test("診断情報のない旧失敗では原因を復元できないと伝え、再試行を勧めない", async ({ page }) => {
  await page.route("**/api/jobs", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        jobs: [
          {
            ...job("legacy_failed", "failed", "IntentIntakeAgent"),
            failure_code: null,
            failure_stage: null,
            provider_status_code: null,
            provider_error_code: null
          }
        ]
      })
    });
  });

  await page.goto("/");
  const failedJob = page.getByLabel("AI処理").getByRole("article", { name: /AI Briefの構造化 失敗/ });
  await expect(failedJob.getByText(/この履歴には原因を判定する診断情報がありません。/)).toBeVisible();
  await expect(failedJob.getByRole("button", { name: "再試行する" })).toHaveCount(0);
  await failedJob.getByRole("button", { name: "詳細を表示" }).click();
  await expect(failedJob.getByText("記録なし（旧履歴）")).toBeVisible();
  await expect(failedJob.getByText("この履歴からの再試行は推奨しません")).toBeVisible();
  await expect(failedJob.getByRole("button", { name: "診断情報をコピー" })).toBeVisible();
});

test("新しい失敗では安全な診断情報と正しい再試行判断を確認できる", async ({ page }) => {
  await page.route("**/api/jobs", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        jobs: [
          {
            ...job("safe_diagnostic_fixture", "failed", "IntentIntakeAgent"),
            failure_code: "api_request_invalid",
            failure_stage: "request",
            provider_status_code: 404,
            provider_error_code: "model_not_found"
          }
        ]
      })
    });
  });

  await page.setViewportSize({ width: 2048, height: 1100 });
  await page.goto("/");
  const failedJob = page.getByLabel("AI処理").getByRole("article", { name: /AI Briefの構造化 失敗/ });
  await failedJob.getByRole("button", { name: "詳細を表示" }).click();
  await expect(failedJob.getByText("APIリクエスト")).toBeVisible();
  await expect(failedJob.getByText("404")).toBeVisible();
  await expect(failedJob.getByText("model_not_found")).toBeVisible();
  await expect(
    failedJob.getByText("アプリが指定した固定実行モデルを利用できませんでした。", { exact: true })
  ).toBeVisible();
  await expect(failedJob.getByText(/アプリ側の実行設定が更新されるまで再試行しない/)).toBeVisible();
  await expect(failedJob.getByRole("button", { name: "再試行する" })).toHaveCount(0);
  if (process.env.MJPS_CAPTURE_EVIDENCE === "1") {
    await page.screenshot({
      path: "../docs/ai-governance/evidence/issue-67/after-safe-diagnostics.png",
      fullPage: true
    });
    await page.locator(".job-list").evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await page.screenshot({
      path: "../docs/ai-governance/evidence/issue-67/after-safe-diagnostics-recovery.png",
      fullPage: true
    });
  }
});

test("再試行のダブルクリックで同じJobを重複送信しない", async ({ page }) => {
  let retryRequests = 0;
  const failedJob = {
    ...job("job_double_retry", "failed", "PromptDoctorAgent"),
    failure_code: "network_unavailable",
    failure_stage: "request"
  };
  await page.route("**/api/jobs", async (route) => {
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ jobs: [failedJob] }) });
  });
  await page.route("**/api/jobs/job_double_retry/retry", async (route) => {
    retryRequests += 1;
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ job: { ...failedJob, status: "queued", retry_count: 1 } })
    });
  });

  await page.goto("/");
  const retryButton = page.getByRole("article", { name: /Prompt Doctorの確認 失敗/ })
    .getByRole("button", { name: "再試行する" });
  await retryButton.dblclick();
  await expect(page.getByRole("button", { name: "再試行中" })).toBeDisabled();
  await page.waitForTimeout(500);
  expect(retryRequests).toBe(1);
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
    failure_code: status === "failed" ? "network_unavailable" : null,
    failure_stage: status === "failed" ? "request" : null,
    provider_status_code: status === "failed" ? 503 : null,
    provider_error_code: status === "failed" ? "server_error" : null,
    created_at: "2026-08-01T00:00:00Z",
    finished_at: status === "queued" || status === "running" ? null : "2026-08-01T00:00:01Z",
    retry_count: 0,
    configured_mode: "real",
    execution_backend: "openai",
    api_key_configured: true,
    response_id_kind: null
  };
}
