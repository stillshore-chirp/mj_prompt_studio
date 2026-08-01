import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ComposerView } from "../src/features/composer/ComposerView";
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

function renderComposer(onAutoSuggest = vi.fn()) {
  return render(
    <ComposerView
      document={document}
      onSave={vi.fn()}
      onCompile={vi.fn()}
      onBrief={vi.fn()}
      onFieldAssist={vi.fn()}
      onAutoSuggest={onAutoSuggest}
      autoSuggestion={null}
      onCopyPrompt={vi.fn()}
    />
  );
}

describe("ComposerView auto suggestion", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not send a suggestion only because the Composer is first rendered", () => {
    const onAutoSuggest = vi.fn();
    const initialDocument = {
      ...document,
      blocks: { ...document.blocks, subject: "Initial content that is intentionally long enough" }
    };

    render(
      <ComposerView
        document={initialDocument}
        onSave={vi.fn()}
        onCompile={vi.fn()}
        onBrief={vi.fn()}
        onFieldAssist={vi.fn()}
        onAutoSuggest={onAutoSuggest}
        autoSuggestion={null}
        onCopyPrompt={vi.fn()}
      />
    );

    act(() => vi.advanceTimersByTime(1000));

    expect(onAutoSuggest).not.toHaveBeenCalled();
  });

  it("does not send a suggestion for an edited value shorter than the minimum length", () => {
    const onAutoSuggest = vi.fn();
    renderComposer(onAutoSuggest);

    fireEvent.change(screen.getByLabelText("Subject"), { target: { value: "too short" } });
    act(() => vi.advanceTimersByTime(1000));

    expect(onAutoSuggest).not.toHaveBeenCalled();
  });

  it("sends one job for an edited revision even if its callback is recreated", () => {
    const firstCallback = vi.fn();
    const view = renderComposer(firstCallback);

    fireEvent.change(screen.getByLabelText("Subject"), {
      target: { value: "Edited content that is long enough for AI assistance" }
    });
    act(() => vi.advanceTimersByTime(1000));

    expect(firstCallback).toHaveBeenCalledTimes(1);
    expect(firstCallback).toHaveBeenLastCalledWith(
      "Edited content that is long enough for AI assistance",
      1
    );

    const recreatedCallback = vi.fn();
    view.rerender(
      <ComposerView
        document={document}
        onSave={vi.fn()}
        onCompile={vi.fn()}
        onBrief={vi.fn()}
        onFieldAssist={vi.fn()}
        onAutoSuggest={recreatedCallback}
        autoSuggestion={null}
        onCopyPrompt={vi.fn()}
      />
    );
    act(() => vi.advanceTimersByTime(1000));

    expect(firstCallback).toHaveBeenCalledTimes(1);
    expect(recreatedCallback).not.toHaveBeenCalled();
  });

  it("creates one new suggestion when the user makes a later edit", () => {
    const onAutoSuggest = vi.fn();
    renderComposer(onAutoSuggest);

    const subject = screen.getByLabelText("Subject");
    fireEvent.change(subject, { target: { value: "First edited content that is long enough" } });
    act(() => vi.advanceTimersByTime(1000));
    fireEvent.change(subject, { target: { value: "Second edited content that is long enough" } });
    act(() => vi.advanceTimersByTime(1000));

    expect(onAutoSuggest).toHaveBeenCalledTimes(2);
    expect(onAutoSuggest).toHaveBeenLastCalledWith(
      "Second edited content that is long enough",
      2
    );
  });

  it("explains that suggestions need confirmation before they are applied", () => {
    renderComposer();

    expect(
      screen.getByText("入力を止めると、最新のPrompt BlocksをAI補助へ送信します。提案は自動適用されません。")
    ).toHaveAttribute("role", "status");
  });
});
