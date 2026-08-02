import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ComposerView } from "../src/features/composer/ComposerView";
import { FreeEditorView } from "../src/features/free-editor/FreeEditorView";
import { MatrixLabView } from "../src/features/matrix-lab/MatrixLabView";
import type { PromptDocument } from "../src/shared/types/api";

const document: PromptDocument = {
  id: "document_1",
  project_id: "project_1",
  title: "Test document",
  ruleset_id: "ruleset_1",
  user_brief: "",
  blocks: {
    intent: "",
    subject: "",
    action_state: "",
    environment: "",
    composition: "",
    camera_lens: "",
    lighting: "",
    material_texture: "",
    color_palette: "",
    style: "",
    text_in_image: [],
    positive_constraints: "",
    notes: ""
  },
  parameters: {
    aspect_ratio: null,
    raw: null,
    stylize: null,
    chaos: null,
    weird: null,
    experimental: null,
    tile: null,
    seed: null,
    speed_mode: null,
    custom: {}
  },
  references: { image_references: [], style_references: [], moodboards: [], personalization_profiles: [] },
  compiled_prompt: "",
  validation_report: null,
  llm_context: {
    latest_response_id: null,
    last_agent: null,
    model: "gpt-5.6-luna",
    reasoning_effort: "high",
    text_verbosity: "low",
    user_vocab_snapshot_id: null,
    project_style_profile_id: null
  },
  notes: "",
  tags: [],
  created_at: "2026-08-01T00:00:00Z",
  updated_at: "2026-08-01T00:00:00Z"
};

describe("empty action availability", () => {
  it("Composerは対象がない操作を止め、有効化条件を表示する", () => {
    render(
      <ComposerView
        document={document}
        onSave={vi.fn()}
        onCompile={vi.fn()}
        onBrief={vi.fn()}
        onFieldAssist={vi.fn()}
        onAutoSuggest={vi.fn()}
        autoSuggestion={null}
        onCopyPrompt={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Compile (Alt+Shift+Enter)" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "AI Brief から構造化" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "コピー (Alt+Shift+C)" })).toBeDisabled();
    expect(screen.getByRole("heading", { name: /プロンプトを作る Composer/ })).toBeVisible();
    expect(screen.getByText("AI Briefを入力すると、構造化のjobを作成できます。")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "AI Briefを入力する" }));
    expect(screen.getByRole("textbox", { name: "AI Brief" })).toHaveFocus();
  });

  it("Free Editorは入力後だけ変換を実行できる", () => {
    const onTransform = vi.fn();
    render(<FreeEditorView result="" detail="" onTransform={onTransform} />);

    const transform = screen.getByRole("button", { name: "英語Prompt化" });
    expect(transform).toBeDisabled();
    expect(screen.getByRole("heading", { name: /既存Promptを整える Free Editor/ })).toBeVisible();
    expect(screen.getByText("Japanese SourceまたはEnglish Promptを入力すると、変換できます。")).toBeVisible();

    fireEvent.change(screen.getByLabelText("Japanese Source"), { target: { value: "朝食会場" } });
    expect(transform).toBeEnabled();
    fireEvent.click(transform);
    expect(onTransform).toHaveBeenCalledWith("英語Prompt化", "朝食会場", "");
  });

  it("Matrix LabはObjectiveとPlanに応じて操作を有効化する", () => {
    const onPlan = vi.fn();
    render(
      <MatrixLabView
        plan={null}
        variants={[]}
        onPlan={onPlan}
        onGenerate={vi.fn()}
        onCopySelected={vi.fn()}
        onCopyAll={vi.fn()}
        onExportCsv={vi.fn()}
        onExportMarkdown={vi.fn()}
      />
    );

    const plan = screen.getByRole("button", { name: "AI Plan" });
    expect(plan).toBeDisabled();
    expect(screen.getByRole("heading", { name: /複数案を比較する Matrix Lab/ })).toBeVisible();
    expect(screen.getByRole("button", { name: "Generate" })).toBeDisabled();
    expect(screen.getByText("Objectiveを入力すると、AI Planを作成できます。")).toBeVisible();

    fireEvent.change(screen.getByLabelText("Objective"), { target: { value: "campaign variations" } });
    expect(plan).toBeEnabled();
    fireEvent.click(plan);
    expect(onPlan).toHaveBeenCalledWith("campaign variations");
  });
});
