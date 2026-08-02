import { ChevronDown, ChevronUp, RefreshCw, RotateCcw, X } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import type { LLMJob } from "../../shared/types/api";
import { displayAgentName, displayExecutionDetails } from "../../shared/utils/user-facing";

interface JobsPanelProps {
  jobs: LLMJob[];
  onRefresh: () => void;
  onCancel: (jobId: string) => void;
  onRetry: (jobId: string) => void;
}

type JobFilter = "attention" | "all" | "processing" | "failed" | "cancelled" | "succeeded";

const completedPreviewLimit = 5;

export function JobsPanel({ jobs, onRefresh, onCancel, onRetry }: JobsPanelProps) {
  const [filter, setFilter] = useState<JobFilter>("attention");
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const orderedJobs = useMemo(() => [...jobs].sort(compareJobs), [jobs]);
  const counts = useMemo(() => countJobs(jobs), [jobs]);
  const filteredJobs = orderedJobs.filter((job) => matchesFilter(job, filter));
  const completedJobs = filteredJobs.filter((job) => job.status === "succeeded");
  const visibleJobs = showAllCompleted
    ? filteredJobs
    : filteredJobs.filter((job) => job.status !== "succeeded").concat(completedJobs.slice(0, completedPreviewLimit));
  const hiddenCompletedCount = completedJobs.length - visibleJobs.filter((job) => job.status === "succeeded").length;

  const selectFilter = (nextFilter: JobFilter) => {
    setFilter(nextFilter);
    setExpandedJobId(null);
    setShowAllCompleted(false);
  };

  return (
    <section className="jobs-panel" aria-label="AI処理">
      <div className="jobs-header">
        <div className="panel-title-row">
          <h2>AI処理</h2>
          <p className="job-summary" aria-live="polite">
            {counts.attention > 0 ? `対応対象 ${counts.attention}件` : "対応対象はありません"}
          </p>
          <button
            type="button"
            className="icon-button"
            onClick={onRefresh}
            title="AI処理の状態を更新"
            aria-label="AI処理の状態を更新"
          >
            <RefreshCw size={15} />
          </button>
        </div>
        <div className="job-filters" role="group" aria-label="AI処理の表示を絞り込む">
          <FilterButton active={filter === "attention"} onClick={() => selectFilter("attention")}>
            対応対象 {counts.attention}
          </FilterButton>
          <FilterButton active={filter === "processing"} onClick={() => selectFilter("processing")}>
            処理中 {counts.processing}
          </FilterButton>
          <FilterButton active={filter === "failed"} onClick={() => selectFilter("failed")}>
            失敗 {counts.failed}
          </FilterButton>
          <FilterButton active={filter === "cancelled"} onClick={() => selectFilter("cancelled")}>
            取消済み {counts.cancelled}
          </FilterButton>
          <FilterButton active={filter === "succeeded"} onClick={() => selectFilter("succeeded")}>
            完了 {counts.succeeded}
          </FilterButton>
          <FilterButton active={filter === "all"} onClick={() => selectFilter("all")}>
            すべて {jobs.length}
          </FilterButton>
        </div>
      </div>

      <div className="job-list" aria-live="polite">
        {visibleJobs.map((job) => {
          const status = jobStatusDetails(job.status);
          const expanded = expandedJobId === job.id;
          const detailsId = `job-details-${job.id}`;
          const agentName = displayAgentName(job.agent_name);
          return (
            <article className={`job-row ${job.status}`} key={job.id} aria-label={`${agentName} ${status.label}`}>
              <div className="job-main">
                <div className="job-title-row">
                  <strong>{agentName}</strong>
                  <span className="job-status">{status.label}</span>
                </div>
                <p className={`job-detail is-${job.status}`} role="status">
                  {status.detail}
                </p>
                {expanded && (
                  <dl className="job-details" id={detailsId}>
                    <div>
                      <dt>対象</dt>
                      <dd>{displayJobTarget(job.agent_name)}</dd>
                    </div>
                    <div>
                      <dt>実行経路</dt>
                      <dd>{displayJobBackend(job.execution_backend)}</dd>
                    </div>
                    <div>
                      <dt>設定モード</dt>
                      <dd>{job.configured_mode === "mock" ? "明示的Mock" : "実API"}</dd>
                    </div>
                    <div>
                      <dt>API key</dt>
                      <dd>{job.api_key_configured ? "設定済み" : "未設定"}</dd>
                    </div>
                    <div>
                      <dt>実行設定</dt>
                      <dd>{displayJobExecution(job)}</dd>
                    </div>
                    <div>
                      <dt>応答の識別</dt>
                      <dd>{job.response_id_kind ? `${job.response_id_kind === "openai" ? "実API" : "Mock"}の応答を確認` : "応答IDは未取得"}</dd>
                    </div>
                    <div>
                      <dt>作成時刻</dt>
                      <dd>{formatJobTime(job.created_at)}</dd>
                    </div>
                    {job.retry_count > 0 && (
                      <div>
                        <dt>再試行</dt>
                        <dd>{job.retry_count}回</dd>
                      </div>
                    )}
                    {job.status === "failed" && (
                      <div className="job-safe-error">
                        <dt>失敗の概要</dt>
                        <dd>結果は適用されていません。入力や接続設定を確認して、再試行できます。</dd>
                      </div>
                    )}
                  </dl>
                )}
              </div>
              <div className="job-actions">
                <button
                  type="button"
                  className="tiny secondary"
                  aria-expanded={expanded}
                  aria-controls={detailsId}
                  onClick={() => setExpandedJobId(expanded ? null : job.id)}
                >
                  {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {expanded ? "詳細を閉じる" : "詳細を表示"}
                </button>
                {(job.status === "queued" || job.status === "running") && (
                  <button
                    type="button"
                    className="tiny danger"
                    onClick={() => onCancel(job.id)}
                  >
                    <X size={14} /> 取り消す
                  </button>
                )}
                {job.status === "failed" && (
                  <button
                    type="button"
                    className="tiny"
                    onClick={() => onRetry(job.id)}
                  >
                    <RotateCcw size={14} /> 再試行する
                  </button>
                )}
              </div>
            </article>
          );
        })}
        {filteredJobs.length === 0 && (
          <p className="job-empty-state">
            {jobs.length === 0
              ? "実行中または履歴のAI処理はありません。AI支援を実行すると、ここで状態を確認できます。"
              : "この表示条件に一致するAI処理はありません。別の状態を選択してください。"}
          </p>
        )}
      </div>
      {hiddenCompletedCount > 0 && (
        <button type="button" className="tiny secondary show-completed" onClick={() => setShowAllCompleted(true)}>
          完了済みをあと{hiddenCompletedCount}件表示
        </button>
      )}
      {showAllCompleted && completedJobs.length > completedPreviewLimit && (
        <button type="button" className="tiny secondary show-completed" onClick={() => setShowAllCompleted(false)}>
          完了済みを5件までに戻す
        </button>
      )}
    </section>
  );
}

function FilterButton({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className="tiny secondary job-filter" aria-pressed={active} onClick={onClick}>
      {children}
    </button>
  );
}

function countJobs(jobs: LLMJob[]) {
  const processing = jobs.filter((job) => job.status === "queued" || job.status === "running").length;
  const failed = jobs.filter((job) => job.status === "failed").length;
  const cancelled = jobs.filter((job) => job.status === "cancelled").length;
  const succeeded = jobs.filter((job) => job.status === "succeeded").length;
  return { processing, failed, cancelled, succeeded, attention: processing + failed + cancelled };
}

function matchesFilter(job: LLMJob, filter: JobFilter): boolean {
  if (filter === "all") {
    return true;
  }
  if (filter === "attention") {
    return job.status !== "succeeded";
  }
  if (filter === "processing") {
    return job.status === "queued" || job.status === "running";
  }
  return job.status === filter;
}

function compareJobs(left: LLMJob, right: LLMJob): number {
  const priority = { running: 0, queued: 1, failed: 2, cancelled: 3, succeeded: 4 } as const;
  const byStatus = priority[left.status] - priority[right.status];
  if (byStatus !== 0) {
    return byStatus;
  }
  return Date.parse(right.created_at) - Date.parse(left.created_at);
}

function displayJobTarget(agentName: string): string {
  const targets: Record<string, string> = {
    IntentIntakeAgent: "現在のPrompt文書",
    VocabularyAgent: "入力中のテキスト",
    PromptCompilerAgent: "現在のPrompt文書",
    PromptDoctorAgent: "現在のPrompt文書",
    ParameterAdvisorAgent: "現在のPrompt文書",
    MatrixPlannerAgent: "Matrix実験計画",
    ResultReviewAgent: "選択中の結果画像",
    FinalAuditorAgent: "現在のPrompt文書",
    ReferenceAnalyzerAgent: "選択中の参照素材"
  };
  return targets[agentName] ?? "現在のプロジェクト";
}

function formatJobTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "記録時刻を取得できません" : date.toLocaleString("ja-JP");
}

function jobStatusDetails(status: LLMJob["status"]): { label: string; detail: string } {
  if (status === "queued") {
    return { label: "待機中", detail: "処理待ちです。必要がなければ取り消せます。" };
  }
  if (status === "running") {
    return { label: "実行中", detail: "処理中です。必要がなければ取り消せます。" };
  }
  if (status === "succeeded") {
    return { label: "完了", detail: "処理が完了しました。結果は対象画面で確認できます。" };
  }
  if (status === "failed") {
    return {
      label: "失敗",
      detail: "この処理を完了できませんでした。結果は適用されていません。入力や接続設定を確認して、再試行してください。"
    };
  }
  return {
    label: "取消済み",
    detail: "処理を取り消しました。結果は適用されていません。必要なら元の操作をもう一度実行してください。"
  };
}

function displayJobBackend(backend: LLMJob["execution_backend"]): string {
  if (backend === "openai") {
    return "OpenAI Responses API";
  }
  if (backend === "mock") {
    return "Mock（外部APIは実行していません）";
  }
  return "実行不可";
}

function displayJobExecution(job: LLMJob): string {
  if (job.execution_backend !== "openai") {
    return "実モデルは呼び出していません";
  }
  return displayExecutionDetails(job.model, job.reasoning_effort, job.text_verbosity);
}
