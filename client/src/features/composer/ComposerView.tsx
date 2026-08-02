import { Clipboard, Save, Sparkles, Wand2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { ScreenGuide } from "../../shared/components/ScreenGuide";
import type { PromptBlocks, PromptDocument, PromptParameters } from "../../shared/types/api";
import {
  blockLabels,
  blockOrder,
  inputToTextList,
  previewFromBlocks,
  textListToInput
} from "../../shared/utils/prompt";

interface ComposerViewProps {
  document: PromptDocument;
  onSave: (payload: ComposerPayload) => void;
  onCompile: (payload: ComposerPayload) => void;
  onBrief: (brief: string) => void;
  onFieldAssist: (mode: string, field: keyof PromptBlocks, text: string) => void;
  onAutoSuggest: (sourceText: string, revision: number) => void;
  autoSuggestion: AutoSuggestionState | null;
  onCopyPrompt: () => void;
  draft?: ComposerPayload | null;
  isDirty?: boolean;
  onDraftChange?: (payload: ComposerPayload) => void;
}

export interface ComposerPayload {
  user_brief: string;
  blocks: PromptBlocks;
  parameters: PromptParameters;
  notes: string;
  tags: string[];
}

export interface AutoSuggestionState {
  sourceText: string;
  revision: number;
  status: "queued" | "running" | "succeeded" | "failed";
}

const assistModes = ["AI補完", "候補", "専門語化", "短縮", "説明"];
const noopDraftChange = () => undefined;

export function ComposerView({
  document,
  onSave,
  onCompile,
  onBrief,
  onFieldAssist,
  onAutoSuggest,
  autoSuggestion,
  onCopyPrompt,
  draft = null,
  isDirty = false,
  onDraftChange = noopDraftChange
}: ComposerViewProps) {
  const [brief, setBrief] = useState(draft?.user_brief ?? document.user_brief);
  const [blocks, setBlocks] = useState<PromptBlocks>(draft?.blocks ?? document.blocks);
  const [autoSuggestionRevision, setAutoSuggestionRevision] = useState(0);
  const briefRef = useRef<HTMLTextAreaElement>(null);
  const sentAutoSuggestionRevision = useRef<number | null>(null);

  useEffect(() => {
    setBrief(draft?.user_brief ?? document.user_brief);
    setBlocks(draft?.blocks ?? document.blocks);
    setAutoSuggestionRevision(0);
    sentAutoSuggestionRevision.current = null;
  }, [document.id, document.user_brief, document.blocks]);

  const preview = useMemo(() => previewFromBlocks(blocks), [blocks]);
  const hasComposerContent = Boolean(brief.trim() || preview.trim());
  const hasBrief = Boolean(brief.trim());
  const hasCompiledPrompt = Boolean(document.compiled_prompt.trim());

  useEffect(() => {
    const sourceText = preview.trim();
    if (
      autoSuggestionRevision === 0 ||
      sourceText.length < 16 ||
      sentAutoSuggestionRevision.current === autoSuggestionRevision
    ) {
      return;
    }
    const timer = window.setTimeout(() => {
      if (sentAutoSuggestionRevision.current === autoSuggestionRevision) {
        return;
      }
      sentAutoSuggestionRevision.current = autoSuggestionRevision;
      onAutoSuggest(sourceText, autoSuggestionRevision);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [autoSuggestionRevision, onAutoSuggest, preview]);

  const isCurrentAutoSuggestion =
    autoSuggestion?.revision === autoSuggestionRevision &&
    autoSuggestion.sourceText === preview.trim();
  const autoSuggestionMessage = getAutoSuggestionMessage(
    isCurrentAutoSuggestion ? autoSuggestion?.status : undefined
  );

  const payload = (): ComposerPayload => ({
    user_brief: brief,
    blocks,
    parameters: document.parameters,
    notes: document.notes,
    tags: document.tags
  });

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (
        !event.altKey ||
        !event.shiftKey ||
        event.metaKey ||
        event.ctrlKey ||
        event.repeat ||
        isEditableShortcutTarget(event.target)
      ) {
        return;
      }

      if (event.code === "KeyS" || event.key.toLowerCase() === "s") {
        event.preventDefault();
        onSave(payload());
        return;
      }
      if ((event.code === "Enter" || event.key === "Enter") && hasComposerContent) {
        event.preventDefault();
        onCompile(payload());
        return;
      }
      if (event.code === "KeyC" || event.key.toLowerCase() === "c") {
        if (!hasCompiledPrompt) {
          return;
        }
        event.preventDefault();
        onCopyPrompt();
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [blocks, brief, document.notes, document.parameters, document.tags, hasCompiledPrompt, hasComposerContent, onCompile, onCopyPrompt, onSave]);

  useEffect(() => {
    onDraftChange(payload());
  }, [blocks, brief, document.notes, document.parameters, document.tags, onDraftChange]);

  return (
    <section className="workspace-pane" aria-label="Composer">
      <ScreenGuide
        step="制作の流れ 1 / 5"
        title="プロンプトを作る"
        featureName="Composer"
        description="作りたい画像を日本語で書き、画像生成サービスへ手動で貼り付けるPromptに整えます。"
        whenToUse="新しい画像を作り始めるとき。手元の既存Promptを整えたいときは「既存Promptを整える」を使います。"
        actions={
          <>
          <p className={`draft-status ${isDirty ? "is-dirty" : ""}`} role="status" aria-live="polite">
            {isDirty ? "未保存の変更" : "保存済み"}
          </p>
          <button
            type="button"
            className="secondary"
            onClick={() => onSave(payload())}
            aria-describedby="composer-shortcuts-help"
            aria-keyshortcuts="Alt+Shift+S"
          >
            <Save size={16} /> 保存 (Alt+Shift+S)
          </button>
          <button
            type="button"
            onClick={() => onCompile(payload())}
            disabled={!hasComposerContent}
            aria-describedby="compile-action-help composer-shortcuts-help"
            aria-keyshortcuts="Alt+Shift+Enter"
          >
            <Wand2 size={16} /> Compile (Alt+Shift+Enter)
          </button>
          </>
        }
      />
      <section className="workflow-guide" aria-labelledby="composer-workflow-title">
        <div>
          <h2 id="composer-workflow-title">まずは、作りたい画像を短く書きます</h2>
          <ol>
            <li>この画面で制作意図を入力して、Promptを整えます。</li>
            <li>コピーしたPromptを画像生成サービスへ手動で貼り付けて、画像を生成します。</li>
            <li>生成した画像は「生成結果を見直す」で取り込み、次の改善案を作れます。</li>
          </ol>
        </div>
        <button type="button" onClick={() => briefRef.current?.focus()}>
          AI Briefを入力する
        </button>
      </section>
      <p id="compile-action-help" className="scope-note">
        {hasComposerContent
          ? "AI BriefまたはPrompt Blocksの入力をCompiled Promptにまとめます。"
          : "AI BriefまたはPrompt Blocksを入力すると、Compileできます。"}
      </p>
      <p id="composer-shortcuts-help" className="scope-note">
        入力欄以外で: Alt+Shift+S 保存 / Alt+Shift+Enter Compile / Alt+Shift+C コピー。入力欄の編集中には実行されません。
      </p>

      <div className="composer-grid">
        <label className="field full">
          <span>AI Brief</span>
          <textarea
            ref={briefRef}
            value={brief}
            onChange={(event) => setBrief(event.currentTarget.value)}
            rows={4}
          />
        </label>
        <button
          type="button"
          className="inline-command"
          onClick={() => onBrief(brief)}
          disabled={!hasBrief}
          aria-describedby="brief-action-help"
        >
          <Sparkles size={16} /> AI Brief から構造化
        </button>
        <p id="brief-action-help" className="scope-note">
          {hasBrief
            ? "入力したAI Briefをもとに、構造化のjobを作成します。"
            : "AI Briefを入力すると、構造化のjobを作成できます。"}
        </p>

        {blockOrder.map((field) => {
          const value = blocks[field];
          const textValue = Array.isArray(value) ? textListToInput(value) : value;
          return (
            <div className="block-editor" key={field}>
              <label className="field">
                <span>{blockLabels[field]}</span>
                <textarea
                  value={textValue}
                  onChange={(event) => {
                    const nextValue =
                      field === "text_in_image"
                        ? inputToTextList(event.currentTarget.value)
                        : event.currentTarget.value;
                    setBlocks({ ...blocks, [field]: nextValue });
                    setAutoSuggestionRevision((current) => current + 1);
                  }}
                  rows={field === "notes" ? 3 : 2}
                />
              </label>
              <div className="assist-row" aria-label={`${blockLabels[field]} assist`}>
                {assistModes.map((mode) => (
                  <button
                    type="button"
                    className="tiny"
                    key={mode}
                    onClick={() => onFieldAssist(mode, field, textValue)}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <p className="assist-status" role="status" aria-live="polite">
        {autoSuggestionMessage}
      </p>

      <div className="preview-columns">
        <section className="plain-panel" aria-label="Live Preview">
          <h2>Live Preview</h2>
          <p>{preview || "未入力"}</p>
        </section>
        <section className="plain-panel" aria-label="Compiled Prompt">
          <div className="panel-title-row">
            <h2>Compiled Prompt</h2>
            <button
              type="button"
              className="secondary"
              onClick={onCopyPrompt}
              disabled={!hasCompiledPrompt}
              aria-describedby="compiled-prompt-copy-help composer-shortcuts-help"
              aria-keyshortcuts="Alt+Shift+C"
            >
              <Clipboard size={16} /> コピー (Alt+Shift+C)
            </button>
          </div>
          <p>{document.compiled_prompt || "未生成"}</p>
          <p id="compiled-prompt-copy-help" className="scope-note">
            {hasCompiledPrompt
              ? "Compiled Promptをクリップボードへコピーできます。"
              : "Compileすると、Compiled Promptをコピーできます。"}
          </p>
        </section>
      </div>
    </section>
  );
}

function isEditableShortcutTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(target.closest("input, textarea, select, [contenteditable]"));
}

function getAutoSuggestionMessage(status: AutoSuggestionState["status"] | undefined): string {
  if (status === "queued") {
    return "最新の入力をAI補助へ送信しました。提案は確認してから適用できます。";
  }
  if (status === "running") {
    return "AI補助が最新の入力から提案を準備しています。提案は自動適用されません。";
  }
  if (status === "succeeded") {
    return "最新の入力への提案を確認できます。提案は自動適用されません。";
  }
  if (status === "failed") {
    return "AI補助の提案を準備できませんでした。入力を編集すると再試行できます。";
  }
  return "入力を止めると、最新のPrompt BlocksをAI補助へ送信します。提案は自動適用されません。";
}
