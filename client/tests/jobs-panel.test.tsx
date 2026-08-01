import { render, screen } from "@testing-library/react";
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
    created_at: "2026-08-01T00:00:00Z",
    finished_at: null,
    retry_count: 0,
    ...overrides
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
            created_at: "2026-08-01T00:00:00Z",
            finished_at: "2026-08-01T00:00:01Z",
            retry_count: 0
          }
        ]}
        onRefresh={vi.fn()}
        onCancel={vi.fn()}
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByText("gpt-5.6-luna · high · low detail")).toBeInTheDocument();
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
          createJob("failed", { error_message: "internal provider trace must not be shown" }),
          createJob("cancelled")
        ]}
        onRefresh={vi.fn()}
        onCancel={vi.fn()}
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByText("待機中")).toBeInTheDocument();
    expect(screen.getByText("実行中")).toBeInTheDocument();
    expect(screen.getByText("完了")).toBeInTheDocument();
    expect(screen.getByText("失敗")).toBeInTheDocument();
    expect(screen.getByText("取消済み")).toBeInTheDocument();
    expect(
      screen.getByText("この処理を完了できませんでした。結果は適用されていません。入力や接続設定を確認して、再試行してください。")
    ).toHaveAttribute("role", "status");
    expect(screen.queryByText("internal provider trace must not be shown")).not.toBeInTheDocument();
    expect(
      screen.getByText("処理を取り消しました。結果は適用されていません。必要なら元の操作をもう一度実行してください。")
    ).toBeInTheDocument();
  });

  it("uses accessible cancel and retry controls for the matching states only", () => {
    const onCancel = vi.fn();
    const onRetry = vi.fn();
    render(
      <JobsPanel
        jobs={[createJob("queued", { id: "queued_job" }), createJob("failed", { id: "failed_job" })]}
        onRefresh={vi.fn()}
        onCancel={onCancel}
        onRetry={onRetry}
      />
    );

    screen.getByRole("button", { name: "VocabularyAgentの処理を取り消す" }).click();
    screen.getByRole("button", { name: "VocabularyAgentの処理を再試行する" }).click();

    expect(onCancel).toHaveBeenCalledWith("queued_job");
    expect(onRetry).toHaveBeenCalledWith("failed_job");
    expect(screen.getByRole("button", { name: "Jobsを更新" })).toBeInTheDocument();
  });
});
