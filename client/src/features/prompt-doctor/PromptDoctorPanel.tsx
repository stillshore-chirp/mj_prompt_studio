import { Stethoscope } from "lucide-react";

import type { PromptPatch, ValidationReport } from "../../shared/types/api";
import { displayFieldName } from "../../shared/utils/user-facing";

interface PromptDoctorPanelProps {
  validationReport: ValidationReport | null;
  patches: PromptPatch[];
  onRun: () => void;
  onApplyPatch: (patch: PromptPatch) => void;
}

export function PromptDoctorPanel({
  validationReport,
  patches,
  onRun,
  onApplyPatch
}: PromptDoctorPanelProps) {
  return (
    <section className="inspector-section" aria-label="Prompt Doctor">
      <div className="panel-title-row">
        <h2>Prompt Doctor</h2>
        <button
          type="button"
          className="icon-button"
          onClick={onRun}
          title="Prompt Doctorで確認する"
          aria-label="Prompt Doctorで確認する"
        >
          <Stethoscope size={16} />
        </button>
      </div>
      <ul className="compact-list">
        {(validationReport?.issues ?? []).map((issue) => (
          <li key={`${issue.code}-${issue.field_path ?? ""}`}>
            <strong>{displaySeverity(issue.severity)}</strong> {issue.message}
          </li>
        ))}
        {!validationReport?.issues.length && <li>見直しが必要な項目はありません。</li>}
      </ul>
      {patches.length > 0 && (
        <div className="patch-list">
          {patches.map((patch) => (
            <button
              type="button"
              className="patch-item"
              key={`${patch.field_path}-${patch.reason}`}
              onClick={() => onApplyPatch(patch)}
            >
              <span>{patch.reason}</span>
              <small>
                {displayFieldName(patch.field_path)} / 提案の確からしさ {Math.round(patch.confidence * 100)}%
              </small>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function displaySeverity(severity: "error" | "warning" | "info"): string {
  if (severity === "error") return "要修正";
  if (severity === "warning") return "確認";
  return "参考";
}
