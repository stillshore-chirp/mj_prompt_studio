import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ResultReviewView } from "../src/features/result-review/ResultReviewView";
import type { ResultImage, ResultReview } from "../src/shared/types/api";

const images: ResultImage[] = [
  resultImage("result-new", "2026-08-02T00:00:00+00:00"),
  resultImage("result-old", "2026-08-01T00:00:00+00:00")
];

describe("ResultReviewView", () => {
  it("選択を切り替えると別画像のレビューを表示せず、再実行導線を示す", () => {
    const onSelectResult = vi.fn();
    render(
      <ResultReviewView
        resultImages={images}
        reviewsByResultId={{ "result-new": review("result-new") }}
        comparisonLines={[]}
        auditResult={null}
        onUpload={vi.fn()}
        onReview={vi.fn()}
        onSelectResult={onSelectResult}
        onCompare={vi.fn()}
        onNextPrompt={vi.fn()}
        onFinalAudit={vi.fn()}
      />
    );

    expect(screen.getByText("new image only")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /結果画像 2:/ }));
    expect(screen.queryByText("new image only")).not.toBeInTheDocument();
    expect(screen.getByText(/この画像には保存済みのAI Reviewがありません/)).toBeInTheDocument();
    expect(onSelectResult).toHaveBeenLastCalledWith("result-old");
  });
});

function resultImage(id: string, createdAt: string): ResultImage {
  return {
    id,
    project_id: "project",
    prompt_document_id: "document",
    prompt_snapshot: "safe prompt",
    parameters_snapshot: {},
    image_metadata: { width: 1, height: 1, format_name: "PNG", file_size_bytes: 1, dominant_colors: [] },
    created_at: createdAt,
    asset_url: `/safe/${id}`
  };
}

function review(resultImageId: string): ResultReview[] {
  return [{
    id: "review-new",
    result_image_id: resultImageId,
    scores: { quality: 8 },
    strengths: [],
    issues: [],
    next_prompt_candidates: [],
    ai_summary: "new image only",
    reviewer: "AI Assistant",
    created_at: "2026-08-02T00:00:00+00:00"
  }];
}
