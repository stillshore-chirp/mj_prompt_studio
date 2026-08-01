import { Clipboard, Download, Grid3X3, Sparkles } from "lucide-react";
import { KeyboardEvent, useState } from "react";

import type { MatrixPlan, MatrixVariant } from "../../shared/types/api";

interface MatrixLabViewProps {
  plan: MatrixPlan | null;
  variants: MatrixVariant[];
  onPlan: (objective: string) => void;
  onGenerate: () => void;
  onCopySelected: (variant: MatrixVariant | null) => void;
  onCopyAll: () => void;
  onExportCsv: () => void;
  onExportMarkdown: () => void;
}

export function MatrixLabView({
  plan,
  variants,
  onPlan,
  onGenerate,
  onCopySelected,
  onCopyAll,
  onExportCsv,
  onExportMarkdown
}: MatrixLabViewProps) {
  const [objective, setObjective] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = variants.find((variant) => variant.id === selectedId) ?? null;
  const hasVariants = variants.length > 0;
  const hasObjective = Boolean(objective.trim());

  function toggleSelection(variantId: string): void {
    setSelectedId((current) => (current === variantId ? null : variantId));
  }

  function selectWithKeyboard(event: KeyboardEvent<HTMLTableRowElement>, variantId: string): void {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleSelection(variantId);
    }
  }

  return (
    <section className="workspace-pane" aria-label="Matrix Lab">
      <div className="section-header">
        <h1>Matrix Lab</h1>
        <div className="toolbar-actions">
          <button
            type="button"
            onClick={() => onPlan(objective)}
            disabled={!hasObjective}
            aria-describedby="matrix-plan-action-help"
          >
            <Sparkles size={16} /> AI Plan
          </button>
          <button
            type="button"
            className="secondary"
            onClick={onGenerate}
            disabled={!plan}
            aria-describedby="matrix-generate-action-help"
          >
            <Grid3X3 size={16} /> Generate
          </button>
        </div>
      </div>
      <label className="field full">
        <span>Objective</span>
        <textarea value={objective} onChange={(event) => setObjective(event.currentTarget.value)} />
      </label>
      <p id="matrix-plan-action-help" className="scope-note">
        {hasObjective
          ? "ObjectiveをもとにMatrix planのjobを作成します。"
          : "Objectiveを入力すると、AI Planを作成できます。"}
      </p>
      <p id="matrix-generate-action-help" className="scope-note">
        {plan
          ? "現在のMatrix planからvariantを生成します。"
          : "AI Planを作成すると、variantを生成できます。"}
      </p>
      {plan && (
        <section className="plain-panel">
          <h2>{plan.objective}</h2>
          <div className="axis-grid">
            {plan.axes.map((axis) => (
              <div key={axis.name}>
                <strong>{axis.name}</strong>
                <span>{axis.values.map(String).join(", ")}</span>
              </div>
            ))}
          </div>
        </section>
      )}
      <div className="toolbar-actions">
        <button type="button" className="secondary" onClick={() => onCopySelected(selected)} disabled={!selected} aria-describedby="matrix-selection-status">
          <Clipboard size={16} /> Selected
        </button>
        <button type="button" className="secondary" onClick={onCopyAll} disabled={!hasVariants} aria-describedby="matrix-selection-status">
          <Clipboard size={16} /> All
        </button>
        <button type="button" className="secondary" onClick={onExportCsv} disabled={!hasVariants} aria-describedby="matrix-selection-status">
          <Download size={16} /> CSV
        </button>
        <button type="button" className="secondary" onClick={onExportMarkdown} disabled={!hasVariants} aria-describedby="matrix-selection-status">
          <Download size={16} /> Markdown
        </button>
      </div>
      <p id="matrix-selection-status" className="scope-note" role="status" aria-live="polite">
        {hasVariants
          ? `${selected ? 1 : 0}件を選択中です。${selected ? "Selectedで選択中のvariantをコピーできます。" : "行を選択するとSelectedを使えます。"}`
          : "variantがありません。AI Planを作成してGenerateすると、コピーと出力を使えます。"}
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">選択</th>
              <th>#</th>
              <th>Prompt</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((variant) => (
              <tr
                key={variant.id}
                className={variant.id === selectedId ? "selected" : ""}
                aria-selected={variant.id === selectedId}
                tabIndex={0}
                onClick={() => toggleSelection(variant.id)}
                onKeyDown={(event) => selectWithKeyboard(event, variant.id)}
              >
                <td><input type="checkbox" aria-label={`variant ${variant.index}を選択`} checked={variant.id === selectedId} onClick={(event) => event.stopPropagation()} onChange={() => toggleSelection(variant.id)} /></td>
                <td>{variant.index}</td>
                <td>{variant.prompt}</td>
                <td>{variant.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
