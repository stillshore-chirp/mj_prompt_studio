import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MatrixLabView } from "../src/features/matrix-lab/MatrixLabView";

const variants = [{ id: "safe-1", index: 1, parameters: {}, prompt: "safe prompt", notes: "safe notes" }];
const props = { plan: null, variants, onPlan: vi.fn(), onGenerate: vi.fn(), onCopySelected: vi.fn(), onCopyAll: vi.fn(), onExportCsv: vi.fn(), onExportMarkdown: vi.fn() };

describe("MatrixLabView", () => {
  it("空状態では出力を無効化し、Enterでvariantを選択できる", () => {
    const { rerender } = render(<MatrixLabView {...props} variants={[]} />);
    expect(screen.getByRole("button", { name: "CSV" })).toBeDisabled();
    expect(screen.getByText(/variantがありません/)).toBeInTheDocument();
    rerender(<MatrixLabView {...props} />);
    const row = screen.getByRole("row", { name: /variant 1を選択/ });
    fireEvent.keyDown(row, { key: "Enter" });
    expect(screen.getByText(/1件を選択中/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Selected" })).toBeEnabled();
  });
});
