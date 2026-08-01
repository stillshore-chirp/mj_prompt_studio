import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReferenceLibraryView } from "../src/features/reference-library/ReferenceLibraryView";
import type { ReferenceAsset } from "../src/shared/types/api";

const references = [reference("reference-a", "safe A", ["a-tag"]), reference("reference-b", "safe B", ["b-tag"])];

describe("ReferenceLibraryView", () => {
  it("未保存タグは確認なしに別素材へ保存せず、破棄確認後は選択素材のタグだけを保存する", () => {
    const onSaveTags = vi.fn();
    render(
      <ReferenceLibraryView
        references={references}
        onUpload={vi.fn()}
        onAnalyze={vi.fn()}
        onSaveTags={onSaveTags}
        onDelete={vi.fn()}
        onVocabularyPatch={vi.fn()}
      />
    );

    const tags = screen.getByRole("textbox", { name: "Tags" });
    expect(tags).toHaveValue("a-tag");
    fireEvent.change(tags, { target: { value: "unsaved-a" } });
    fireEvent.click(screen.getByRole("button", { name: /safe B/ }));

    expect(screen.getByRole("dialog", { name: "未保存のタグを破棄しますか？" })).toBeInTheDocument();
    expect(tags).toHaveValue("unsaved-a");
    fireEvent.click(screen.getByRole("button", { name: "破棄して切り替える" }));
    expect(screen.getByRole("textbox", { name: "Tags" })).toHaveValue("b-tag");

    fireEvent.click(screen.getByRole("button", { name: "Tags 保存" }));
    expect(onSaveTags).toHaveBeenCalledWith("reference-b", ["b-tag"]);
  });
});

function reference(id: string, name: string, tags: string[]): ReferenceAsset {
  return {
    id,
    project_id: "safe-project",
    type: "reference",
    name,
    external_url: null,
    tags,
    ai_analysis: { summary: "", colors: [], lighting: "", composition: "", material_texture: "", suggested_mode: "", extracted_vocabulary: [], confidence: 0 },
    image_metadata: { width: 1, height: 1, format_name: "PNG", file_size_bytes: 1, dominant_colors: [] },
    notes: "",
    created_at: "2026-08-02T00:00:00+00:00",
    updated_at: "2026-08-02T00:00:00+00:00",
    asset_url: `/safe/${id}`
  };
}
