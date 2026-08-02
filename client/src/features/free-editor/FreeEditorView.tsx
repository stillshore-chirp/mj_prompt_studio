import { Copy, Sparkles, WandSparkles } from "lucide-react";
import { useState } from "react";

import { ScreenGuide } from "../../shared/components/ScreenGuide";
import type { ArrangePreset, PromptWorkshopResult } from "../../shared/types/api";

const transformModes = [
  "英語Prompt化",
  "専門語化",
  "短縮",
  "詳細化",
  "商用向け",
  "構図強化"
];

const lengthOptions = [
  { value: 0.5, label: "半分" },
  { value: 0.8, label: "2割減" },
  { value: 1, label: "同程度" },
  { value: 1.2, label: "2割増" },
  { value: 2, label: "倍" }
];

interface FreeEditorViewProps {
  result: string;
  detail: string;
  workshopResults: Record<string, PromptWorkshopResult | undefined>;
  presets: ArrangePreset[];
  presetWarning: string | null;
  isBusy: boolean;
  onTransform: (mode: string, source: string, prompt: string) => void;
  onGenerate: (payload: {
    count: number;
    chaosLevel: number;
    outputLanguage: "en" | "ja";
    guidance: string;
    deduplicate: boolean;
  }) => void;
  onPromptTransform: (payload: {
    mode: "worldbuilding" | "chaos_mix";
    sourcePrompt: string;
    outputLanguage: "source" | "en" | "ja";
    maxCharacters: number | null;
    additionalGuidance: string;
  }) => void;
  onLengthAdjust: (payload: {
    sourcePrompt: string;
    lengthRatio: number;
    maxCharacters: number | null;
  }) => void;
  onArrange: (payload: {
    sourcePrompt: string;
    presetId: string;
    strength: number;
    additionalGuidance: string;
    lengthRatio: number;
    maxCharacters: number | null;
    outputLanguage: "source" | "en" | "ja";
  }) => void;
  onCopy: (text: string, message: string) => void;
  onUseInComposer: (text: string) => void;
}

export function FreeEditorView({
  result,
  detail,
  workshopResults,
  presets,
  presetWarning,
  isBusy,
  onTransform,
  onGenerate,
  onPromptTransform,
  onLengthAdjust,
  onArrange,
  onCopy,
  onUseInComposer
}: FreeEditorViewProps) {
  const [source, setSource] = useState("");
  const [generatorCount, setGeneratorCount] = useState(10);
  const [chaosLevel, setChaosLevel] = useState(1);
  const [generatorLanguage, setGeneratorLanguage] = useState<"en" | "ja">("en");
  const [generatorGuidance, setGeneratorGuidance] = useState("");
  const [deduplicate, setDeduplicate] = useState(true);
  const [selectedGeneratedPrompt, setSelectedGeneratedPrompt] = useState<string | null>(null);
  const [outputLanguage, setOutputLanguage] = useState<"source" | "en" | "ja">("source");
  const [maxCharacters, setMaxCharacters] = useState<number | null>(null);
  const [additionalGuidance, setAdditionalGuidance] = useState("");
  const [lengthRatio, setLengthRatio] = useState(1);
  const [presetId, setPresetId] = useState("auto");
  const [strength, setStrength] = useState(1);
  const hasSource = Boolean(source.trim());
  const generatorResult = workshopResults.generator;

  const usePrompt = (text: string) => {
    setSource(text);
    setSelectedGeneratedPrompt(text);
  };

  return (
    <section className="workspace-pane prompt-workshop" aria-label="Prompt Workshop">
      <ScreenGuide
        step="制作の流れ 2 / 5（必要なとき）"
        title="Promptを生成・整える"
        featureName="Prompt Workshop"
        description="材料がないときは複数案を生成し、既存Promptは目的別に整えます。生成と既存文の操作は分けているため、必要な方だけ使えます。"
        whenToUse="発想の起点がないとき、または既存Promptを意図に合わせて再構成したいとき。"
      />

      <section className="plain-panel" aria-labelledby="generator-title">
        <h2 id="generator-title">ゼロからPromptを生成</h2>
        <p>件数・カオス度・出力言語だけで案を作れます。任意ガイダンスは空でも実行できます。</p>
        <div className="form-grid">
          <label className="field">
            <span>件数</span>
            <input
              type="number"
              min={1}
              max={30}
              value={generatorCount}
              onChange={(event) => setGeneratorCount(Number(event.currentTarget.value) || 1)}
            />
          </label>
          <label className="field">
            <span>カオス度 {chaosLevel} / 10</span>
            <input
              type="range"
              min={1}
              max={10}
              value={chaosLevel}
              onChange={(event) => setChaosLevel(Number(event.currentTarget.value))}
            />
          </label>
          <label className="field">
            <span>出力言語</span>
            <select
              value={generatorLanguage}
              onChange={(event) => setGeneratorLanguage(event.currentTarget.value as "en" | "ja")}
            >
              <option value="en">英語</option>
              <option value="ja">日本語</option>
            </select>
          </label>
          <label className="field">
            <span>任意ガイダンス</span>
            <input
              value={generatorGuidance}
              maxLength={2000}
              onChange={(event) => setGeneratorGuidance(event.currentTarget.value)}
            />
          </label>
        </div>
        <label className="switch-row">
          <input
            type="checkbox"
            checked={deduplicate}
            onChange={(event) => setDeduplicate(event.currentTarget.checked)}
          />
          <span>完全に同じ案を除外する</span>
        </label>
        <button
          type="button"
          disabled={isBusy}
          onClick={() =>
            onGenerate({
              count: generatorCount,
              chaosLevel,
              outputLanguage: generatorLanguage,
              guidance: generatorGuidance,
              deduplicate
            })
          }
        >
          <Sparkles size={16} /> Prompt案を生成
        </button>
        <PromptList
          result={generatorResult}
          selected={selectedGeneratedPrompt}
          onSelect={usePrompt}
          onCopy={onCopy}
        />
      </section>

      <section className="plain-panel" aria-labelledby="existing-title">
        <h2 id="existing-title">既存Promptを整える</h2>
        <label className="field">
          <span>作業中のPrompt</span>
          <textarea
            aria-describedby="workshop-source-help"
            value={source}
            maxLength={20000}
            rows={7}
            onChange={(event) => setSource(event.currentTarget.value)}
          />
        </label>
        <p id="workshop-source-help" className="scope-note">
          文字数のみ調整は除外語句を適用せず、意味保持を優先します。その他の創作系操作にはSettingsの除外語句が適用されます。
        </p>
        <div className="form-grid">
          <label className="field">
            <span>出力言語</span>
            <select
              value={outputLanguage}
              onChange={(event) =>
                setOutputLanguage(event.currentTarget.value as "source" | "en" | "ja")
              }
            >
              <option value="source">入力と同じ</option>
              <option value="en">英語</option>
              <option value="ja">日本語</option>
            </select>
          </label>
          <label className="field">
            <span>文字数上限</span>
            <select
              value={maxCharacters ?? ""}
              onChange={(event) =>
                setMaxCharacters(event.currentTarget.value ? Number(event.currentTarget.value) : null)
              }
            >
              <option value="">制限なし</option>
              {[250, 500, 750, 1000, 1250].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>任意ガイダンス</span>
            <input
              value={additionalGuidance}
              maxLength={2000}
              onChange={(event) => setAdditionalGuidance(event.currentTarget.value)}
            />
          </label>
        </div>
        <div className="button-grid">
          <button
            type="button"
            disabled={!hasSource || isBusy}
            onClick={() =>
              onPromptTransform({
                mode: "worldbuilding",
                sourcePrompt: source,
                outputLanguage,
                maxCharacters,
                additionalGuidance
              })
            }
          >
            <WandSparkles size={16} /> 世界観整形
          </button>
          <button
            type="button"
            disabled={!hasSource || isBusy}
            onClick={() =>
              onPromptTransform({
                mode: "chaos_mix",
                sourcePrompt: source,
                outputLanguage,
                maxCharacters,
                additionalGuidance
              })
            }
          >
            <WandSparkles size={16} /> カオスミックス
          </button>
        </div>
        <PromptResult
          title="世界観整形"
          result={workshopResults.worldbuilding}
          onCopy={onCopy}
          onUse={usePrompt}
          onUseInComposer={onUseInComposer}
        />
        <PromptResult
          title="カオスミックス"
          result={workshopResults.chaos_mix}
          onCopy={onCopy}
          onUse={usePrompt}
          onUseInComposer={onUseInComposer}
        />
      </section>

      <section className="plain-panel" aria-labelledby="length-title">
        <h2 id="length-title">文字数のみ調整</h2>
        <p>意味・主題・画風を維持する専用操作です。上限を超えた場合だけ、同じJob内で最大1回の調整を試みます。</p>
        <div className="form-grid">
          <label className="field">
            <span>文字数目標</span>
            <select
              value={lengthRatio}
              onChange={(event) => setLengthRatio(Number(event.currentTarget.value))}
            >
              {lengthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>文字数上限</span>
            <input
              type="number"
              min={50}
              max={5000}
              value={maxCharacters ?? ""}
              onChange={(event) =>
                setMaxCharacters(event.currentTarget.value ? Number(event.currentTarget.value) : null)
              }
            />
          </label>
        </div>
        <button
          type="button"
          disabled={!hasSource || isBusy}
          onClick={() => onLengthAdjust({ sourcePrompt: source, lengthRatio, maxCharacters })}
        >
          <WandSparkles size={16} /> 文字数を調整
        </button>
        <PromptResult
          title="文字数調整の結果"
          result={workshopResults.length_adjust}
          onCopy={onCopy}
          onUse={usePrompt}
          onUseInComposer={onUseInComposer}
        />
      </section>

      <section className="plain-panel" aria-labelledby="arrange-title">
        <h2 id="arrange-title">LLMアレンジ</h2>
        <p>プリセットと強度を選び、元の主題と主要語句を保ちながら視覚表現を整えます。</p>
        {presetWarning ? <p role="status">{presetWarning}</p> : null}
        <div className="form-grid">
          <label className="field">
            <span>プリセット</span>
            <select value={presetId} onChange={(event) => setPresetId(event.currentTarget.value)}>
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label_ja}（{preset.category}）
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>強度 {strength} / 3</span>
            <input
              type="range"
              min={0}
              max={3}
              value={strength}
              onChange={(event) => setStrength(Number(event.currentTarget.value))}
            />
          </label>
        </div>
        <button
          type="button"
          disabled={!hasSource || isBusy || presets.length === 0}
          onClick={() =>
            onArrange({
              sourcePrompt: source,
              presetId,
              strength,
              additionalGuidance,
              lengthRatio,
              maxCharacters,
              outputLanguage
            })
          }
        >
          <WandSparkles size={16} /> アレンジを実行
        </button>
        <PromptResult
          title="アレンジ結果"
          result={workshopResults.arrange}
          onCopy={onCopy}
          onUse={usePrompt}
          onUseInComposer={onUseInComposer}
        />
      </section>

      <section className="plain-panel" aria-labelledby="legacy-title">
        <h2 id="legacy-title">既存の変換</h2>
        <div className="button-grid">
          {transformModes.map((mode) => (
            <button
              type="button"
              key={mode}
              disabled={!hasSource || isBusy}
              onClick={() => onTransform(mode, source, "")}
            >
              <WandSparkles size={16} /> {mode}
            </button>
          ))}
        </div>
        <textarea aria-label="既存変換の結果" value={result} readOnly rows={5} />
        {detail ? <p>{detail}</p> : null}
      </section>
    </section>
  );
}

function PromptList({
  result,
  selected,
  onSelect,
  onCopy
}: {
  result: PromptWorkshopResult | undefined;
  selected: string | null;
  onSelect: (text: string) => void;
  onCopy: (text: string, message: string) => void;
}) {
  if (!result?.prompts) {
    return null;
  }
  return (
    <section className="workshop-result" aria-live="polite">
      <h3>生成結果</h3>
      <p>
        生成 {result.generated_count} / 指定 {result.requested_count}
        {result.excluded_count ? "、除外 " + result.excluded_count : ""}
      </p>
      {result.warnings?.map((warning) => <p key={warning}>{warning}</p>)}
      <div className="prompt-result-list">
        {result.prompts.map((prompt, index) => (
          <article key={`${prompt.text}-${index}`} className={selected === prompt.text ? "selected" : ""}>
            <label>
              <input
                type="radio"
                name="generated-prompt"
                checked={selected === prompt.text}
                onChange={() => onSelect(prompt.text)}
              />
              <span>{index + 1}. {prompt.text}</span>
            </label>
            <button
              type="button"
              className="secondary"
              onClick={() => onCopy(prompt.text, "Prompt案をコピーしました")}
            >
              <Copy size={16} /> コピー
            </button>
            <button type="button" className="secondary" onClick={() => onSelect(prompt.text)}>
              入力欄へ反映
            </button>
          </article>
        ))}
      </div>
      <button
        type="button"
        className="secondary"
        onClick={() =>
          onCopy(
            result.prompts?.map((prompt) => prompt.text).join("\n") ?? "",
            "全てのPrompt案をコピーしました"
          )
        }
      >
        <Copy size={16} /> 全件を1行ずつコピー
      </button>
    </section>
  );
}

function PromptResult({
  title,
  result,
  onCopy,
  onUse,
  onUseInComposer
}: {
  title: string;
  result: PromptWorkshopResult | undefined;
  onCopy: (text: string, message: string) => void;
  onUse: (text: string) => void;
  onUseInComposer: (text: string) => void;
}) {
  if (!result?.prompt) {
    return null;
  }
  return (
    <section className="workshop-result" aria-live="polite">
      <h3>{title}</h3>
      <textarea aria-label={title} value={result.prompt} readOnly rows={5} />
      <p>
        元 {result.source_body_count ?? result.original_body_count ?? "—"}文字 / 結果{" "}
        {result.result_body_count ?? result.result_count ?? "—"}文字
      </p>
      {result.target_count ? <p>目標 {result.target_count}文字</p> : null}
      {result.preserved_anchor_count !== undefined ? <p>保持語句 {result.preserved_anchor_count}件</p> : null}
      {result.quality_repair_attempts ? <p>文字数の再調整 {result.quality_repair_attempts}回</p> : null}
      {result.warnings?.map((warning) => <p key={warning}>{warning}</p>)}
      <div className="inline-form">
        <button
          type="button"
          className="secondary"
          onClick={() => onCopy(result.prompt ?? "", "結果をコピーしました")}
        >
          <Copy size={16} /> 結果をコピー
        </button>
        <button type="button" className="secondary" onClick={() => onUse(result.prompt ?? "")}>
          入力欄へ反映
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => onUseInComposer(result.prompt ?? "")}
        >
          Composerへ取り込む
        </button>
      </div>
    </section>
  );
}
