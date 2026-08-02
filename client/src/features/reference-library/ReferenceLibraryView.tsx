import { Search, Sparkles, Trash2 } from "lucide-react";
import { DragEvent, useEffect, useMemo, useRef, useState } from "react";

import type { ReferenceAsset } from "../../shared/types/api";
import { ConfirmDialog } from "../../shared/components/ConfirmDialog";
import { ImageUploadControl } from "../../shared/components/ImageUploadControl";
import { ScreenGuide } from "../../shared/components/ScreenGuide";

interface ReferenceLibraryViewProps {
  references: ReferenceAsset[];
  onUpload: (file: File) => void;
  onAnalyze: (referenceId: string) => void;
  onSaveTags: (referenceId: string, tags: string[]) => void | Promise<void>;
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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const uploadButtonRef = useRef<HTMLButtonElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(references[0]?.id ?? null);
  const [tagDraftDirty, setTagDraftDirty] = useState(false);
  const [pendingSelectionId, setPendingSelectionId] = useState<string | null>(null);
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

  const selectReference = (referenceId: string) => {
    if (referenceId === selected?.id) {
      return;
    }
    if (tagDraftDirty) {
      setPendingSelectionId(referenceId);
      return;
    }
    setSelectedId(referenceId);
  };

  const discardTagDraftAndSelect = () => {
    if (pendingSelectionId) {
      setSelectedId(pendingSelectionId);
    }
    setPendingSelectionId(null);
    setTagDraftDirty(false);
  };

  return (
    <section className="workspace-pane" aria-label="Reference Library">
      <ScreenGuide
        step="制作の流れ 3 / 5（必要なとき）"
        title="参考画像からヒントを得る"
        featureName="Reference Library"
        description="参考画像から、雰囲気・構図・質感を確認し、Promptに使える語彙を取り出します。"
        whenToUse="表現の方向性に迷うとき、または手元の参考画像を次のPromptへ生かしたいとき。"
        actions={
          <ImageUploadControl
          buttonLabel="参照素材の画像を選択して追加"
          helpText="対応形式は画像ファイルです。選択した画像は参照素材としてこのプロジェクトへ追加します。"
          onUpload={onUpload}
          buttonRef={uploadButtonRef}
          />
        }
      />
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
        <input ref={searchInputRef} value={query} onChange={(event) => setQuery(event.currentTarget.value)} placeholder="Search" />
      </label>
      <div className="library-grid">
        <div className="item-list">
          {filtered.map((reference) => (
            <button
              type="button"
              className={`asset-list-item ${reference.id === selected?.id ? "active" : ""}`}
              key={reference.id}
              onClick={() => selectReference(reference.id)}
            >
              <img src={reference.asset_url} alt="" />
              <span>{reference.name}</span>
              <small>{reference.type}</small>
            </button>
          ))}
          {references.length === 0 && (
            <section className="plain-panel empty-state" aria-live="polite">
              <h2>参照素材がありません</h2>
              <p>画像を追加すると、制作の雰囲気や構図を確認し、AI分析で使える語彙を取り出せます。</p>
              <p>上の「参照素材の画像を選択して追加」から画像を選ぶか、ドロップ領域へ画像ファイルを置いてください。</p>
              <button type="button" className="secondary" onClick={() => uploadButtonRef.current?.focus()}>
                参照素材の画像を追加する
              </button>
            </section>
          )}
          {references.length > 0 && filtered.length === 0 && (
            <section className="plain-panel empty-state" role="status" aria-live="polite">
              <h2>一致する参照素材がありません</h2>
              <p>「{query}」に一致する名前・種類・タグはありません。素材は削除されていません。</p>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setQuery("");
                  searchInputRef.current?.focus();
                }}
              >
                検索をクリアして全件を表示
              </button>
            </section>
          )}
        </div>
        {selected && (
          <ReferenceDetail
            key={selected.id}
            reference={selected}
            onAnalyze={onAnalyze}
            onSaveTags={onSaveTags}
            onDelete={onDelete}
            onVocabularyPatch={onVocabularyPatch}
            onTagDraftDirtyChange={setTagDraftDirty}
          />
        )}
      </div>
      <ConfirmDialog
        open={pendingSelectionId !== null}
        title="未保存のタグを破棄しますか？"
        description="タグの編集内容はまだ保存されていません。破棄して別の参照素材へ切り替えるか、キャンセルして現在の素材に戻ります。"
        confirmLabel="破棄して切り替える"
        onCancel={() => setPendingSelectionId(null)}
        onConfirm={discardTagDraftAndSelect}
      >
        <p>保存する場合は、現在の素材の「Tags 保存」を先に実行してください。</p>
      </ConfirmDialog>
    </section>
  );
}

interface ReferenceDetailProps {
  reference: ReferenceAsset;
  onAnalyze: (referenceId: string) => void;
  onSaveTags: (referenceId: string, tags: string[]) => void | Promise<void>;
  onDelete: (reference: ReferenceAsset) => void;
  onVocabularyPatch: (vocabulary: string) => void;
  onTagDraftDirtyChange: (dirty: boolean) => void;
}

function ReferenceDetail({
  reference,
  onAnalyze,
  onSaveTags,
  onDelete,
  onVocabularyPatch,
  onTagDraftDirtyChange
}: ReferenceDetailProps) {
  const [tagText, setTagText] = useState(reference.tags.join(", "));
  const savedTagText = reference.tags.join(", ");

  useEffect(() => {
    onTagDraftDirtyChange(false);
    return () => onTagDraftDirtyChange(false);
  }, [onTagDraftDirtyChange]);

  const updateTagText = (nextTagText: string) => {
    setTagText(nextTagText);
    onTagDraftDirtyChange(nextTagText !== savedTagText);
  };

  const saveTags = () => {
    Promise.resolve(onSaveTags(
      reference.id,
      tagText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    ))
      .then(() => onTagDraftDirtyChange(false))
      .catch(() => undefined);
  };
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
        <input value={tagText} onChange={(event) => updateTagText(event.currentTarget.value)} />
      </label>
      <button
        type="button"
        className="secondary"
        onClick={saveTags}
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
