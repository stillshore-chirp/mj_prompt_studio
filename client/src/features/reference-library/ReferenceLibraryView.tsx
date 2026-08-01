import { Search, Sparkles, Trash2 } from "lucide-react";
import { DragEvent, useMemo, useState } from "react";

import type { ReferenceAsset } from "../../shared/types/api";
import { ImageUploadControl } from "../../shared/components/ImageUploadControl";

interface ReferenceLibraryViewProps {
  references: ReferenceAsset[];
  onUpload: (file: File) => void;
  onAnalyze: (referenceId: string) => void;
  onSaveTags: (referenceId: string, tags: string[]) => void;
  onDelete: (reference: ReferenceAsset) => void;
  onVocabularyPatch: (vocabulary: string) => void;
}

export function ReferenceLibraryView({
  references,
  onUpload,
  onAnalyze,
  onSaveTags,
  onDelete,
  onVocabularyPatch
}: ReferenceLibraryViewProps) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(references[0]?.id ?? null);
  const selected = references.find((reference) => reference.id === selectedId) ?? references[0];
  const filtered = useMemo(() => {
    const normalized = query.toLowerCase();
    return references.filter((reference) =>
      [reference.name, reference.type, reference.tags.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [query, references]);

  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files.item(0);
    if (!file || !file.type.startsWith("image/")) {
      setUploadStatus("画像ファイルをドロップしてください。対応形式は画像ファイルです。");
      return;
    }
    setUploadStatus(`「${file.name}」を追加します。`);
    onUpload(file);
  };

  return (
    <section className="workspace-pane" aria-label="Reference Library">
      <div className="section-header">
        <h1>Reference Library</h1>
        <ImageUploadControl
          buttonLabel="参照素材の画像を選択して追加"
          helpText="対応形式は画像ファイルです。選択した画像は参照素材としてこのプロジェクトへ追加します。"
          onUpload={onUpload}
        />
      </div>
      <div
        className="drop-zone"
        role="region"
        aria-label="参照素材の画像をドロップして追加"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <p><Search size={15} /> 画像をここへドロップして追加できます。キーボードでは上の「参照素材の画像を選択して追加」を使えます。</p>
      </div>
      {uploadStatus ? <p role="status" aria-live="polite">{uploadStatus}</p> : null}
      <label className="field search-field">
        <span>参照素材を検索</span>
        <input value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="Search" />
      </label>
      <div className="library-grid">
        <div className="item-list">
          {filtered.map((reference) => (
            <button
              type="button"
              className={`asset-list-item ${reference.id === selected?.id ? "active" : ""}`}
              key={reference.id}
              onClick={() => setSelectedId(reference.id)}
            >
              <img src={reference.asset_url} alt="" />
              <span>{reference.name}</span>
              <small>{reference.type}</small>
            </button>
          ))}
        </div>
        {selected && (
          <ReferenceDetail
            reference={selected}
            onAnalyze={onAnalyze}
            onSaveTags={onSaveTags}
            onDelete={onDelete}
            onVocabularyPatch={onVocabularyPatch}
          />
        )}
      </div>
    </section>
  );
}

interface ReferenceDetailProps {
  reference: ReferenceAsset;
  onAnalyze: (referenceId: string) => void;
  onSaveTags: (referenceId: string, tags: string[]) => void;
  onDelete: (reference: ReferenceAsset) => void;
  onVocabularyPatch: (vocabulary: string) => void;
}

function ReferenceDetail({
  reference,
  onAnalyze,
  onSaveTags,
  onDelete,
  onVocabularyPatch
}: ReferenceDetailProps) {
  const [tagText, setTagText] = useState(reference.tags.join(", "));
  return (
    <article className="asset-detail">
      <img className="asset-preview" src={reference.asset_url} alt={reference.name} />
      <div className="panel-title-row">
        <h2>{reference.name}</h2>
        <div className="toolbar-actions">
          <button
            type="button"
            className="icon-button"
            aria-label="Analyze reference"
            title="Analyze reference"
            onClick={() => onAnalyze(reference.id)}
          >
            <Sparkles size={15} />
          </button>
          <button
            type="button"
            className="icon-button danger"
            aria-label="Delete reference"
            title="Delete reference"
            onClick={() => onDelete(reference)}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      <dl className="meta-list">
        <div>
          <dt>Size</dt>
          <dd>
            {reference.image_metadata.width} x {reference.image_metadata.height}
          </dd>
        </div>
        <div>
          <dt>Format</dt>
          <dd>{reference.image_metadata.format_name}</dd>
        </div>
      </dl>
      <div className="swatches">
        {reference.image_metadata.dominant_colors.map((color) => (
          <span key={color} title={color} style={{ background: color }} />
        ))}
      </div>
      <label className="field">
        <span>Tags</span>
        <input value={tagText} onChange={(event) => setTagText(event.currentTarget.value)} />
      </label>
      <button
        type="button"
        className="secondary"
        onClick={() =>
          onSaveTags(
            reference.id,
            tagText
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          )
        }
      >
        Tags 保存
      </button>
      <section className="plain-panel">
        <h3>AI Analysis</h3>
        <p>{reference.ai_analysis.summary || "未解析"}</p>
        <div className="button-grid compact">
          {reference.ai_analysis.extracted_vocabulary.map((term) => (
            <button type="button" key={term} onClick={() => onVocabularyPatch(term)}>
              {term}
            </button>
          ))}
        </div>
      </section>
    </article>
  );
}
