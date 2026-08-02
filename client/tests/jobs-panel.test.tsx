import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { JobsPanel } from "../src/features/jobs/JobsPanel";
import type { LLMJob } from "../src/shared/types/api";
import { formatSafeJobDiagnostics } from "../src/shared/utils/job-failure";

function createJob(status: LLMJob["status"], overrides: Partial<LLMJob> = {}): LLMJob {
  return {
    id: `job_${status}`,
    agent_name: "VocabularyAgent",
    model: "gpt-5.6-luna",
    reasoning_effort: "high",
    text_verbosity: "low",
    status,
    input_snapshot: {},
    output_json: status === "succeeded" ? {} : null,
    error_message: null,
    failure_code: null,
    failure_stage: null,
    provider_status_code: null,
    provider_error_code: null,
    created_at: "2026-08-01T00:00:00Z",
    finished_at: null,
    retry_count: 0,
    ...overrides,
    configured_mode: overrides.configured_mode ?? "real",
    execution_backend: overrides.execution_backend ?? "openai",
    api_key_configured: overrides.api_key_configured ?? true,
    response_id_kind: overrides.response_id_kind ?? (status === "succeeded" ? "openai" : null)
  };
}

describe("JobsPanel", () => {
  it("shows the effective model, reasoning, and response detail", () => {
    render(
      <JobsPanel
        jobs={[
          {
            id: "job_1",
            agent_name: "VocabularyAgent",
            model: "gpt-5.6-luna",
            reasoning_effort: "high",
            text_verbosity: "low",
            status: "succeeded",
            input_snapshot: {},
            output_json: {},
            error_message: null,
            failure_code: null,
            failure_stage: null,
            provider_status_code: null,
            provider_error_code: null,
            created_at: "2026-08-01T00:00:00Z",
            finished_at: "2026-08-01T00:00:01Z",
            retry_count: 0,
            configured_mode: "real",
            execution_backend: "openai",
            api_key_configured: true,
            response_id_kind: "openai"
          }
        ]}
        onRefresh={vi.fn()}
        onCancel={vi.fn()}
        onRetry={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "完了 1" }));
    fireEvent.click(screen.getByRole("button", { name: "詳細を表示" }));
    expect(screen.getByText("GPT-5.6 Luna・高い推論・簡潔な応答")).toBeInTheDocument();
    expect(screen.getByText("OpenAI Responses API")).toBeInTheDocument();
    expect(screen.getByText("実API")).toBeInTheDocument();
    expect(screen.getByText("設定済み")).toBeInTheDocument();
    expect(screen.getByText("実APIの応答を確認")).toBeInTheDocument();
  });

  it("does not display a real model as used for an explicit Mock job", () => {
    render(
      <JobsPanel
        jobs={[createJob("succeeded", { execution_backend: "mock", configured_mode: "mock", response_id_kind: "mock" })]}
        onRefresh={vi.fn()}
        onCancel={vi.fn()}
        onRetry={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "完了 1" }));
    fireEvent.click(screen.getByRole("button", { name: "詳細を表示" }));
    expect(screen.getByText("Mock（外部APIは実行していません）")).toBeInTheDocument();
    expect(screen.getByText("明示的Mock")).toBeInTheDocument();
    expect(screen.getByText("設定済み")).toBeInTheDocument();
    expect(screen.getByText("実モデルは呼び出していません")).toBeInTheDocument();
    expect(screen.queryByText("GPT-5.6 Luna・高い推論・簡潔な応答")).not.toBeInTheDocument();
  });
});

describe("JobsPanel status feedback", () => {
  it("allowlist外のproviderコードを診断情報へ転記しない", () => {
    const diagnostics = formatSafeJobDiagnostics(
      createJob("failed", { provider_error_code: "private-provider-detail" })
    );

    expect(diagnostics).toContain("Providerコード: 記録なし");
    expect(diagnostics).not.toContain("private-provider-detail");
  });

  it("distinguishes every Job state and explains the next recovery action", () => {
    render(
      <JobsPanel
        jobs={[
          createJob("queued"),
          createJob("running"),
          createJob("succeeded"),
          createJob("failed", {
            error_message: "internal provider trace must not be shown",
            failure_code: "api_authentication_failed"
          }),
          createJob("cancelled")
        ]}
        onRefresh={vi.fn()}
        onCancel={vi.fn()}
        onRetry={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    expect(screen.getByText("待機中")).toBeInTheDocument();
    expect(screen.getByText("実行中")).toBeInTheDocument();
    expect(screen.getByText("失敗")).toBeInTheDocument();
    expect(screen.getByText("取消済み")).toBeInTheDocument();
    expect(
      screen.getByText("実APIの認証を確認できませんでした。結果は適用されていません。設定でAPI keyを確認または適用してから、再試行してください。")
    ).toHaveAttribute("role", "status");
    expect(screen.queryByText("internal provider trace must not be shown")).not.toBeInTheDocument();
    expect(
      screen.getByText("処理を取り消しました。結果は適用されていません。必要なら元の操作をもう一度実行してください。")
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "完了 1" }));
    expect(screen.getByText("完了")).toBeInTheDocument();
  });

  it("uses accessible cancel and retry controls for the matching states only", () => {
    const onCancel = vi.fn();
    const onRetry = vi.fn();
    const onOpenSettings = vi.fn();
    render(
      <JobsPanel
        jobs={[
          createJob("queued", { id: "queued_job" }),
          createJob("failed", { id: "failed_job", failure_code: "network_unavailable" })
        ]}
        onRefresh={vi.fn()}
        onCancel={onCancel}
        onRetry={onRetry}
        onOpenSettings={onOpenSettings}
      />
    );

    screen.getByRole("button", { name: "取り消す" }).click();
    screen.getByRole("button", { name: "再試行する" }).click();

    expect(onCancel).toHaveBeenCalledWith("queued_job");
    expect(onRetry).toHaveBeenCalledWith("failed_job");
    expect(screen.getByRole("button", { name: "AI処理の状態を更新" })).toBeInTheDocument();
  });

  it("再試行リクエスト中はボタンを無効化する", () => {
    render(
      <JobsPanel
        jobs={[
          createJob("failed", { id: "retrying_job", failure_code: "network_unavailable" })
        ]}
        onRefresh={vi.fn()}
        onCancel={vi.fn()}
        onRetry={vi.fn()}
        onOpenSettings={vi.fn()}
        retryingJobIds={new Set(["retrying_job"])}
      />
    );

    expect(screen.getByRole("button", { name: "再試行中" })).toBeDisabled();
  });

  it("診断情報がない旧履歴では原因を復元できないと伝え、再試行を出さない", () => {
    render(
      <JobsPanel
        jobs={[createJob("failed", { id: "legacy_failure" })]}
        onRefresh={vi.fn()}
        onCancel={vi.fn()}
        onRetry={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    expect(screen.getByText(/この履歴には原因を判定する診断情報がありません。/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "再試行する" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "詳細を表示" }));
    expect(screen.getByText("記録なし（旧履歴）")).toBeInTheDocument();
    expect(screen.getByText("この履歴からの再試行は推奨しません")).toBeInTheDocument();
  });

  it("安全な診断情報だけをコピーし、生のerror・入力・識別子を含めない", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(
      <JobsPanel
        jobs={[
          createJob("failed", {
            id: "job_fixture_identifier",
            input_snapshot: { brief: "SENSITIVE_FIXTURE_DO_NOT_COPY" },
            error_message: "RAW_FIXTURE_DO_NOT_COPY",
            failure_code: "api_quota_exhausted",
            failure_stage: "request",
            provider_status_code: 429,
            provider_error_code: "insufficient_quota"
          })
        ]}
        onRefresh={vi.fn()}
        onCancel={vi.fn()}
        onRetry={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "診断情報をコピー" }));
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const copied = writeText.mock.calls[0][0] as string;
    expect(copied).toContain("失敗分類: api_quota_exhausted");
    expect(copied).toContain("HTTP状態: 429");
    expect(copied).toContain("Providerコード: insufficient_quota");
    expect(copied).not.toContain("SENSITIVE_FIXTURE_DO_NOT_COPY");
    expect(copied).not.toContain("RAW_FIXTURE_DO_NOT_COPY");
    expect(copied).not.toContain("job_fixture_identifier");
    expect(await screen.findByText(/安全な診断情報をコピーしました/)).toHaveAttribute("role", "status");
  });

  it("clipboardを使えない場合は安全な診断情報を手動コピーできる", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("blocked")) }
    });
    render(
      <JobsPanel
        jobs={[createJob("failed", { failure_code: "unexpected", failure_stage: "unknown" })]}
        onRefresh={vi.fn()}
        onCancel={vi.fn()}
        onRetry={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "診断情報をコピー" }));
    expect((await screen.findByLabelText("手動コピー用の安全な診断情報") as HTMLTextAreaElement).value)
      .toContain("失敗分類: unexpected");
    expect(screen.queryByRole("button", { name: "再試行する" })).not.toBeInTheDocument();
  });

  it("固定モデルを利用できない失敗を設定問題や再試行可能として扱わない", () => {
    render(
      <JobsPanel
        jobs={[
          createJob("failed", {
            failure_code: "api_request_invalid",
            failure_stage: "request",
            provider_status_code: 404,
            provider_error_code: "model_not_found"
          })
        ]}
        onRefresh={vi.fn()}
        onCancel={vi.fn()}
        onRetry={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    expect(screen.getByText(/アプリが指定した固定実行モデルを利用できませんでした。/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "再試行する" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "設定を開く" })).not.toBeInTheDocument();
  });

  it("応答保存拒否では汎用providerコードよりPrivacy modeの復旧案内を優先する", () => {
    render(
      <JobsPanel
        jobs={[
          createJob("failed", {
            failure_code: "response_storage_rejected",
            failure_stage: "request",
            provider_status_code: 400,
            provider_error_code: "invalid_value"
          })
        ]}
        onRefresh={vi.fn()}
        onCancel={vi.fn()}
        onRetry={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    expect(screen.getByText(/現在の応答保存設定では実APIがこの処理を受け付けませんでした。/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "設定を開く" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "再試行する" })).toBeInTheDocument();
  });

  it("構造化応答を1回再試行しても失敗したJobでは再試行を繰り返せない", () => {
    render(
      <JobsPanel
        jobs={[
          createJob("failed", {
            failure_code: "structured_output_invalid",
            failure_stage: "response_validation",
            retry_count: 1
          })
        ]}
        onRefresh={vi.fn()}
        onCancel={vi.fn()}
        onRetry={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    expect(screen.getByText(/1回の再試行でも完了できませんでした。/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "再試行する" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "詳細を表示" }));
    expect(screen.getByText("再試行済みです。これ以上同じJobを繰り返さないでください")).toBeInTheDocument();
  });

  it("guides setting-related failures to Settings and avoids retry for a rate limit", () => {
    const onOpenSettings = vi.fn();
    render(
      <JobsPanel
        jobs={[
          createJob("failed", {
            id: "auth_failure",
            failure_code: "api_authentication_failed"
          }),
          createJob("failed", {
            id: "rate_limit",
            failure_code: "rate_limited"
          }),
          createJob("failed", {
            id: "quota_exhausted",
            failure_code: "api_quota_exhausted"
          })
        ]}
        onRefresh={vi.fn()}
        onCancel={vi.fn()}
        onRetry={vi.fn()}
        onOpenSettings={onOpenSettings}
      />
    );

    expect(screen.getAllByRole("button", { name: "再試行する" })).toHaveLength(2);
    expect(screen.getByText(/少し待ってから、元の操作をもう一度実行してください。/)).toBeInTheDocument();
    expect(
      screen.getByText(/OpenAI Platformで利用枠・請求状態を確認し、必要な更新後に再試行してください。/)
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "設定を開く" })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "設定を開く" }));
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it("優先順位・絞り込み・段階的な完了履歴によって復帰対象を先に見せる", () => {
    const succeeded = Array.from({ length: 7 }, (_, index) =>
      createJob("succeeded", {
        id: `completed_${index}`,
        created_at: `2026-08-01T00:00:0${index}Z`
      })
    );
    render(
      <JobsPanel
        jobs={[
          ...succeeded,
          createJob("cancelled", { id: "cancelled_job" }),
          createJob("failed", { id: "failed_job" }),
          createJob("queued", { id: "queued_job" }),
          createJob("running", { id: "running_job" })
        ]}
        onRefresh={vi.fn()}
        onCancel={vi.fn()}
        onRetry={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    const articles = screen.getAllByRole("article");
    expect(articles.map((article) => article.getAttribute("aria-label"))).toEqual([
      "表現の調整 実行中",
      "表現の調整 待機中",
      "表現の調整 失敗",
      "表現の調整 取消済み"
    ]);
    expect(screen.queryByText("completed_0")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "完了 7" })).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(screen.getByRole("button", { name: "完了 7" }));
    expect(screen.getAllByRole("article")).toHaveLength(5);
    expect(screen.getByRole("button", { name: "完了済みをあと2件表示" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "完了済みをあと2件表示" }));
    expect(screen.getAllByRole("article")).toHaveLength(7);
  });

  it("詳細で対象と安全な失敗概要を表示し、生のbackend errorを出さない", () => {
    render(
      <JobsPanel
        jobs={[
          createJob("failed", {
            error_message: "internal provider trace must not be shown",
            failure_code: "response_storage_rejected"
          })
        ]}
        onRefresh={vi.fn()}
        onCancel={vi.fn()}
        onRetry={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );

    const detail = screen.getByRole("button", { name: "詳細を表示" });
    fireEvent.click(detail);

    expect(detail).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("入力中のテキスト")).toBeInTheDocument();
    expect(screen.getByText("原因")).toBeInTheDocument();
    expect(screen.getByText("現在の応答保存設定では実APIがこの処理を受け付けませんでした。")).toBeInTheDocument();
    expect(screen.getByText("次にできること")).toBeInTheDocument();
    expect(screen.queryByText("internal provider trace must not be shown")).not.toBeInTheDocument();
  });
});
