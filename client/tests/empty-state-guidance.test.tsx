import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MatrixLabView } from "../src/features/matrix-lab/MatrixLabView";
import { ReferenceLibraryView } from "../src/features/reference-library/ReferenceLibraryView";
import { ResultReviewView } from "../src/features/result-review/ResultReviewView";
import type { ReferenceAsset } from "../src/shared/types/api";

describe("empty state guidance", () => {
  it("Referenceの初回空と検索結果なしを区別し、主要操作へフォーカスできる", () => {
    const { rerender } = render(<ReferenceLibraryView {...referenceProps} references={[]} />);

    expect(screen.getByRole("heading", { name: /参考画像からヒントを得る Reference Library/ })).toBeVisible();
    expect(screen.getByText("参照素材がありません")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "参照素材の画像を追加する" }));
    expect(screen.getByRole("button", { name: "参照素材の画像を選択して追加" })).toHaveFocus();

    rerender(<ReferenceLibraryView {...referenceProps} references={[reference("safe reference")]} />);
    fireEvent.change(screen.getByRole("textbox", { name: "参照素材を検索" }), { target: { value: "missing" } });
    expect(screen.getByText("一致する参照素材がありません")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "検索をクリアして全件を表示" }));
    expect(screen.getByRole("textbox", { name: "参照素材を検索" })).toHaveFocus();
    expect(screen.getByRole("button", { name: /safe reference/ })).toBeVisible();
  });

  it("Result Reviewの初回空から画像追加へキーボードで進める", () => {
    render(
      <ResultReviewView
        resultImages={[]}
        reviewsByResultId={{}}
        comparisonLines={[]}
        auditResult={null}
        onUpload={vi.fn()}
        onReview={vi.fn()}
        onSelectResult={vi.fn()}
        onCompare={vi.fn()}
        onNextPrompt={vi.fn()}
        onFinalAudit={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: /生成結果を見直す Result Review/ })).toBeVisible();
    expect(screen.getByText("確認する生成結果画像がありません")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "生成結果の画像を追加する" }));
    expect(screen.getByRole("button", { name: "生成結果の画像を選択して追加" })).toHaveFocus();
  });

  it("Matrixの初回空とplan済みの部分状態から主要操作へ進める", () => {
    const props = matrixProps();
    const { rerender } = render(<MatrixLabView {...props} plan={null} variants={[]} />);

    expect(screen.getByText("まだMatrix planがありません")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Objectiveを入力する" }));
    expect(screen.getByRole("textbox", { name: "Objective" })).toHaveFocus();

    rerender(<MatrixLabView {...props} plan={plan} variants={[]} />);
    expect(screen.getByText("まだvariantがありません")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "生成ボタンへ移動" }));
    expect(screen.getByRole("button", { name: "Generate" })).toHaveFocus();
  });
});

const referenceProps = {
  onUpload: vi.fn(),
  onAnalyze: vi.fn(),
  onSaveTags: vi.fn(),
  onDelete: vi.fn(),
  onVocabularyPatch: vi.fn()
};

const plan = {
  id: "safe-plan",
  objective: "safe comparison",
  axes: [{ name: "light", description: "safe axis", values: ["soft", "hard"] }],
  fixed_conditions: {},
  evaluation_points: [],
  max_variants: 4
};

function matrixProps() {
  return {
    onPlan: vi.fn(),
    onGenerate: vi.fn(),
    onCopySelected: vi.fn(),
    onCopyAll: vi.fn(),
    onExportCsv: vi.fn(),
    onExportMarkdown: vi.fn()
  };
}

function reference(name: string): ReferenceAsset {
  return {
    id: "safe-reference",
    project_id: "safe-project",
    type: "reference",
    name,
    external_url: null,
    tags: [],
    ai_analysis: { summary: "", colors: [], lighting: "", composition: "", material_texture: "", suggested_mode: "", extracted_vocabulary: [], confidence: 0 },
    image_metadata: { width: 1, height: 1, format_name: "PNG", file_size_bytes: 1, dominant_colors: [] },
    notes: "",
    created_at: "2026-08-02T00:00:00+00:00",
    updated_at: "2026-08-02T00:00:00+00:00",
    asset_url: "/safe/reference"
  };
}
