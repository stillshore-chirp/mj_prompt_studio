import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ImageUploadControl } from "../src/shared/components/ImageUploadControl";

describe("ImageUploadControl", () => {
  it("keeps a semantic picker button and rejects a non-image before upload", () => {
    const onUpload = vi.fn();
    const { container } = render(
      <ImageUploadControl
        buttonLabel="参照素材の画像を選択して追加"
        helpText="画像を追加します。"
        onUpload={onUpload}
      />
    );

    expect(screen.getByRole("button", { name: "参照素材の画像を選択して追加" })).toBeInTheDocument();
    const input = container.querySelector('input[type="file"]');
    expect(input).not.toBeNull();

    fireEvent.change(input!, { target: { files: [new File(["plain text"], "note.txt", { type: "text/plain" })] } });

    expect(onUpload).not.toHaveBeenCalled();
    expect(screen.getByText("画像ファイルを選択してください。対応形式は画像ファイルです。")).toHaveAttribute("role", "status");
  });
});
