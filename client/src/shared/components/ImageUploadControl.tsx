import { ImagePlus } from "lucide-react";
import { type Ref, useId, useRef, useState } from "react";

interface ImageUploadControlProps {
  buttonLabel: string;
  helpText: string;
  onUpload: (file: File) => void;
  buttonRef?: Ref<HTMLButtonElement>;
}

export function ImageUploadControl({ buttonLabel, helpText, onUpload, buttonRef }: ImageUploadControlProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const helpId = useId();
  const statusId = useId();
  const [status, setStatus] = useState<string | null>(null);

  function selectFile(file: File | null): void {
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      setStatus("画像ファイルを選択してください。対応形式は画像ファイルです。");
      return;
    }
    setStatus(`「${file.name}」を追加します。アップロードに失敗した場合は下部の状態表示を確認して再試行してください。`);
    onUpload(file);
  }

  return (
    <div className="image-upload-control">
      <button
        ref={buttonRef}
        type="button"
        className="file-button"
        aria-describedby={`${helpId} ${statusId}`}
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus size={16} /> {buttonLabel}
      </button>
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="image/*"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(event) => {
          selectFile(event.currentTarget.files?.[0] ?? null);
          event.currentTarget.value = "";
        }}
      />
      <p id={helpId}>{helpText}</p>
      <p id={statusId} role="status" aria-live="polite">{status ?? ""}</p>
    </div>
  );
}
