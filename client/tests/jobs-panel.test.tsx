import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { JobsPanel } from "../src/features/jobs/JobsPanel";
import type { LLMJob } from "../src/shared/types/api";

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
        jobs={[createJob("queued", { id: "queued_job" }), createJob("failed", { id: "failed_job" })]}
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
          })
        ]}
        onRefresh={vi.fn()}
        onCancel={vi.fn()}
        onRetry={vi.fn()}
        onOpenSettings={onOpenSettings}
      />
    );

    expect(screen.getAllByRole("button", { name: "再試行する" })).toHaveLength(1);
    expect(screen.getByText(/少し待ってから、元の操作をもう一度実行してください。/)).toBeInTheDocument();
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
