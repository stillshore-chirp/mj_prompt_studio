import { ClipboardCheck, GitCompare, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { JsonObject, ResultImage, ResultReview } from "../../shared/types/api";
import { ImageUploadControl } from "../../shared/components/ImageUploadControl";

interface ResultReviewViewProps {
  resultImages: ResultImage[];
  reviewsByResultId: Record<string, ResultReview[]>;
  comparisonLines: string[];
  auditResult: JsonObject | null;
  onUpload: (file: File) => void;
  onReview: (resultImageId: string) => void;
  onSelectResult: (resultImageId: string) => void;
  onCompare: () => void;
  onNextPrompt: (candidate: string) => void;
  onFinalAudit: () => void;
}

export function ResultReviewView({
  resultImages,
  reviewsByResultId,
  comparisonLines,
  auditResult,
  onUpload,
  onReview,
  onSelectResult,
  onCompare,
  onNextPrompt,
  onFinalAudit
}: ResultReviewViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(resultImages[0]?.id ?? null);
  const uploadButtonRef = useRef<HTMLButtonElement>(null);
  const knownResultImageIds = useRef(new Set(resultImages.map((image) => image.id)));
  const selected = useMemo(
    () => resultImages.find((image) => image.id === selectedId) ?? resultImages[0],
    [resultImages, selectedId]
  );
  const selectedReviews = selected ? reviewsByResultId[selected.id] ?? [] : [];
  const latestReview = selectedReviews[0] ?? null;

  useEffect(() => {
    if (selected) {
      onSelectResult(selected.id);
    }
  }, [onSelectResult, selected]);

  useEffect(() => {
    const newlyAdded = resultImages.find((image) => !knownResultImageIds.current.has(image.id));
    knownResultImageIds.current = new Set(resultImages.map((image) => image.id));
    if (newlyAdded) {
      setSelectedId(newlyAdded.id);
    }
  }, [resultImages]);

  return (
    <section className="workspace-pane" aria-label="Result Review">
      <div className="section-header">
        <h1>Result Review</h1>
        <ImageUploadControl
          buttonLabel="生成結果の画像を選択して追加"
          helpText="対応形式は画像ファイルです。選択した画像はこのプロジェクトのResult Reviewへ追加します。"
          onUpload={onUpload}
          buttonRef={uploadButtonRef}
        />
      </div>
      <div className="library-grid">
        <div className="item-list">
          {resultImages.map((image, index) => (
            <button
              type="button"
              className={`asset-list-item ${image.id === selected?.id ? "active" : ""}`}
              key={image.id}
              aria-label={`結果画像 ${index + 1}: ${formatResultImage(image)}`}
              aria-pressed={image.id === selected?.id}
              onClick={() => setSelectedId(image.id)}
            >
              <img src={image.asset_url} alt="" />
              <span>{formatResultImage(image)}</span>
            </button>
          ))}
          {resultImages.length === 0 && (
            <section className="plain-panel empty-state" aria-live="polite">
              <h2>確認する生成結果画像がありません</h2>
              <p>生成サービスで作成した画像を追加すると、この画面で画像ごとのAI Reviewと比較を行えます。</p>
              <button type="button" className="secondary" onClick={() => uploadButtonRef.current?.focus()}>
                生成結果の画像を追加する
              </button>
            </section>
          )}
        </div>
        {selected && (
          <article className="asset-detail">
            <img className="asset-preview" src={selected.asset_url} alt="" />
            <div className="toolbar-actions">
              <button type="button" onClick={() => onReview(selected.id)}>
                <Sparkles size={16} /> 選択中の結果画像を AI Review
              </button>
              <button type="button" className="secondary" onClick={onCompare}>
                <GitCompare size={16} /> Compare
              </button>
              <button type="button" className="secondary" onClick={onFinalAudit}>
                <ClipboardCheck size={16} /> Final Audit
              </button>
            </div>
            <section className="plain-panel">
              <h2>Source Prompt</h2>
              <p className="scope-note">対象: 選択中の結果画像（{formatResultImage(selected)}）</p>
              <p>{selected.prompt_snapshot}</p>
              <pre>{JSON.stringify(selected.parameters_snapshot, null, 2)}</pre>
            </section>
            {latestReview && (
              <section className="plain-panel">
                <h2>AI Review（選択中の結果画像）</h2>
                <p className="scope-note">対象: {formatResultImage(selected)}。別の画像の評価は表示しません。</p>
                <p>{latestReview.ai_summary}</p>
                <div className="score-grid">
                  {Object.entries(latestReview.scores).map(([key, value]) => (
                    <span key={key}>
                      {key}: {value}
                    </span>
                  ))}
                </div>
                <div className="button-grid compact">
                  {latestReview.next_prompt_candidates.map((candidate) => (
                    <button
                      type="button"
                      key={candidate}
                      onClick={() => onNextPrompt(candidate)}
                    >
                      Next Prompt
                    </button>
                  ))}
                </div>
              </section>
            )}
            {!latestReview && (
              <section className="plain-panel" aria-live="polite">
                <h2>AI Review（選択中の結果画像）</h2>
                <p>この画像には保存済みのAI Reviewがありません。上の「選択中の結果画像を AI Review」から再実行できます。</p>
              </section>
            )}
          </article>
        )}
      </div>
      {comparisonLines.length > 0 && (
        <section className="plain-panel">
          <h2>Comparison</h2>
          <p className="scope-note">対象: 現在のプロジェクト内のすべての生成結果。選択中の1画像だけの評価ではありません。</p>
          <pre>{comparisonLines.join("\n")}</pre>
        </section>
      )}
      {auditResult && (
        <section className="plain-panel">
          <h2>Final Audit</h2>
          <p className="scope-note">対象: 現在のPrompt文書全体。選択中の結果画像のAI Reviewではありません。</p>
          <pre>{JSON.stringify(auditResult, null, 2)}</pre>
        </section>
      )}
    </section>
  );
}

function formatResultImage(image: ResultImage): string {
  return new Date(image.created_at).toLocaleString();
}
