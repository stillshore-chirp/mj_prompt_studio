import { RefreshCw, RotateCcw, X } from "lucide-react";

import type { LLMJob } from "../../shared/types/api";
import { displayAgentName, displayExecutionDetails } from "../../shared/utils/user-facing";

interface JobsPanelProps {
  jobs: LLMJob[];
  onRefresh: () => void;
  onCancel: (jobId: string) => void;
  onRetry: (jobId: string) => void;
}

export function JobsPanel({ jobs, onRefresh, onCancel, onRetry }: JobsPanelProps) {
  return (
    <section className="jobs-panel" aria-label="AI処理">
      <div className="panel-title-row">
        <h2>AI処理</h2>
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
      <div className="job-list">
        {jobs.map((job) => (
          <article className={`job-row ${job.status}`} key={job.id}>
            <div>
              <strong>{displayAgentName(job.agent_name)}</strong>
              <span>{jobStatusDetails(job.status).label}</span>
              <small className="job-meta">
                {displayExecutionDetails(job.model, job.reasoning_effort, job.text_verbosity)}
              </small>
              <p className={`job-detail is-${job.status}`} role="status">
                {jobStatusDetails(job.status).detail}
              </p>
            </div>
            <div className="job-actions">
              {(job.status === "queued" || job.status === "running") && (
                <button
                  type="button"
                  className="icon-button"
                  title="処理を取り消す"
                  aria-label={`${displayAgentName(job.agent_name)}を取り消す`}
                  onClick={() => onCancel(job.id)}
                >
                  <X size={14} />
                </button>
              )}
              {job.status === "failed" && (
                <button
                  type="button"
                  className="icon-button"
                  title="処理を再試行する"
                  aria-label={`${displayAgentName(job.agent_name)}を再試行する`}
                  onClick={() => onRetry(job.id)}
                >
                  <RotateCcw size={14} />
                </button>
              )}
            </div>
          </article>
        ))}
        {jobs.length === 0 && <p>実行中または履歴のAI処理はありません。</p>}
      </div>
    </section>
  );
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
