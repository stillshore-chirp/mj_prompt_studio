import { WandSparkles } from "lucide-react";
import { useState } from "react";

const transformModes = [
  "英語Prompt化",
  "専門語化",
  "短縮",
  "詳細化",
  "商用向け",
  "構図強化"
];

interface FreeEditorViewProps {
  result: string;
  detail: string;
  onTransform: (mode: string, source: string, prompt: string) => void;
}

export function FreeEditorView({ result, detail, onTransform }: FreeEditorViewProps) {
  const [source, setSource] = useState("");
  const [prompt, setPrompt] = useState("");
  const hasSource = Boolean(source.trim() || prompt.trim());

  return (
    <section className="workspace-pane" aria-label="Free Editor">
      <div className="section-header">
        <h1>Free Editor</h1>
      </div>
      <div className="free-editor-grid">
        <label className="field">
          <span>Japanese Source</span>
          <textarea value={source} onChange={(event) => setSource(event.currentTarget.value)} />
        </label>
        <label className="field">
          <span>English Prompt</span>
          <textarea value={prompt} onChange={(event) => setPrompt(event.currentTarget.value)} />
        </label>
      </div>
      <div className="button-grid">
        {transformModes.map((mode) => (
          <button
            type="button"
            key={mode}
            onClick={() => onTransform(mode, source, prompt)}
            disabled={!hasSource}
            aria-describedby="free-editor-action-help"
          >
            <WandSparkles size={16} /> {mode}
          </button>
        ))}
      </div>
      <p id="free-editor-action-help" className="scope-note">
        {hasSource
          ? "Japanese SourceまたはEnglish Promptをもとに、変換jobを作成します。"
          : "Japanese SourceまたはEnglish Promptを入力すると、変換できます。"}
      </p>
      <section className="plain-panel">
        <h2>Result</h2>
        <textarea aria-label="Transform Result" value={result} readOnly rows={6} />
        {detail && <p>{detail}</p>}
      </section>
    </section>
  );
}
