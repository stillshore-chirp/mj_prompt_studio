import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRef, useState } from "react";
import { describe, expect, it } from "vitest";

import { ConfirmDialog } from "../src/shared/components/ConfirmDialog";

type DialogKind = "patch" | "delete" | "manual-copy";

function DialogScenario({ kind }: { kind: DialogKind }) {
  const [open, setOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const labels = {
    patch: {
      title: "変更を適用しますか？",
      description: "提案された変更で既存の入力内容を置き換える場合があります。内容を確認してから適用してください。",
      confirmLabel: "変更を適用"
    },
    delete: {
      title: "参照を削除しますか？",
      description: "「安全なfixture」を削除します。この操作は取り消せません。",
      confirmLabel: "削除する"
    },
    "manual-copy": {
      title: "Manual Copy",
      description: "コピーが自動でできなかったため、表示されたテキストを選択してコピーしてください。閉じても内容は変更されません。",
      confirmLabel: "閉じる"
    }
  } as const;
  const label = labels[kind];

  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        {kind}を開く
      </button>
      <button type="button">背景の操作</button>
      <ConfirmDialog
        open={open}
        title={label.title}
        description={label.description}
        confirmLabel={label.confirmLabel}
        initialFocusRef={kind === "manual-copy" ? textareaRef : undefined}
        onCancel={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
      >
        {kind === "manual-copy" ? (
          <textarea ref={textareaRef} aria-label="コピーするテキスト" readOnly value="safe fixture text" />
        ) : (
          <p>安全なfixtureの確認内容</p>
        )}
      </ConfirmDialog>
    </div>
  );
}

describe("ConfirmDialog", () => {
  it("Patch確認で安全なキャンセルへfocusし、dialog内だけをTab移動する", async () => {
    render(<DialogScenario kind="patch" />);

    const opener = screen.getByRole("button", { name: "patchを開く" });
    const backgroundAction = screen.getByRole("button", { name: "背景の操作" });
    opener.focus();
    fireEvent.click(opener);

    const dialog = screen.getByRole("dialog", { name: "変更を適用しますか？" });
    const cancel = screen.getByRole("button", { name: "キャンセル" });
    const confirm = screen.getByRole("button", { name: "変更を適用" });
    await waitFor(() => expect(cancel).toHaveFocus());
    expect(dialog).toHaveAccessibleDescription(
      "提案された変更で既存の入力内容を置き換える場合があります。内容を確認してから適用してください。"
    );
    expect(backgroundAction).toHaveAttribute("inert");
    expect(backgroundAction).toHaveAttribute("aria-hidden", "true");

    confirm.focus();
    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(cancel).toHaveFocus();
    cancel.focus();
    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(confirm).toHaveFocus();
  });

  it("削除確認はEscで閉じ、呼び出し元へfocusを戻す", async () => {
    render(<DialogScenario kind="delete" />);

    const opener = screen.getByRole("button", { name: "deleteを開く" });
    opener.focus();
    fireEvent.click(opener);
    const dialog = screen.getByRole("dialog", { name: "参照を削除しますか？" });
    expect(dialog).toHaveAccessibleDescription("「安全なfixture」を削除します。この操作は取り消せません。");

    fireEvent.keyDown(dialog, { key: "Escape" });

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(opener).toHaveFocus();
  });

  it("Manual Copyはテキストへfocusし、キャンセルで安全に復帰する", async () => {
    render(<DialogScenario kind="manual-copy" />);

    const opener = screen.getByRole("button", { name: "manual-copyを開く" });
    opener.focus();
    fireEvent.click(opener);

    const dialog = screen.getByRole("dialog", { name: "Manual Copy" });
    const textarea = screen.getByRole("textbox", { name: "コピーするテキスト" });
    await waitFor(() => expect(textarea).toHaveFocus());
    expect(dialog).toHaveAccessibleDescription(
      "コピーが自動でできなかったため、表示されたテキストを選択してコピーしてください。閉じても内容は変更されません。"
    );

    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(opener).toHaveFocus();
  });

  it("確定操作でも呼び出し元へfocusを戻す", async () => {
    render(<DialogScenario kind="patch" />);

    const opener = screen.getByRole("button", { name: "patchを開く" });
    opener.focus();
    fireEvent.click(opener);
    fireEvent.click(screen.getByRole("button", { name: "変更を適用" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(opener).toHaveFocus();
  });
});
