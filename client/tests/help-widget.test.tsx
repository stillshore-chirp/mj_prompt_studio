import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HelpWidget } from "../src/features/help/HelpWidget";

describe("HelpWidget", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("右下buttonからmodalを使わずにQuick Startを開き、目次を表示する", () => {
    render(<HelpWidget context="composer" />);

    const trigger = screen.getByRole("button", { name: "使い方" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("heading", { name: "使い方" })).toHaveFocus();
    expect(screen.getByRole("navigation", { name: "最初に試す流れの目次" })).toBeVisible();
    expect(screen.getByRole("tabpanel", { name: "最初に試す流れ" })).toHaveTextContent("最初のプロンプトを作る");
  });

  it("文書の切替と現在画面へのクイックジャンプで、必要な手順へ移動できる", () => {
    const scrollIntoView = vi.fn();
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    Object.defineProperty(Element.prototype, "scrollIntoView", { configurable: true, value: scrollIntoView });
    render(<HelpWidget context="free-editor" />);

    fireEvent.click(screen.getByRole("button", { name: "使い方" }));
    fireEvent.click(screen.getByRole("button", { name: "この画面の使い方へ" }));

    expect(screen.getByRole("tabpanel", { name: "ユーザーマニュアル" })).toHaveTextContent("Prompt Workshop");
    expect(scrollIntoView).toHaveBeenCalled();
  });

  it("Escapeで閉じ、起点のbuttonへfocusを戻す", async () => {
    render(<HelpWidget context="settings" />);
    const trigger = screen.getByRole("button", { name: "使い方" });
    fireEvent.click(trigger);

    fireEvent.keyDown(screen.getByRole("region", { name: "使い方" }), { key: "Escape" });

    expect(screen.queryByRole("heading", { name: "使い方" })).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("文書tabを矢印キーで切り替え、選択中の文書を対応付ける", async () => {
    render(<HelpWidget context="composer" />);
    fireEvent.click(screen.getByRole("button", { name: "使い方" }));

    const quickStart = screen.getByRole("tab", { name: "最初に試す流れ" });
    fireEvent.keyDown(quickStart, { key: "ArrowRight" });

    const userManual = screen.getByRole("tab", { name: "ユーザーマニュアル" });
    expect(userManual).toHaveAttribute("aria-selected", "true");
    await waitFor(() => expect(userManual).toHaveFocus());
    expect(screen.getByRole("tabpanel", { name: "ユーザーマニュアル" })).toHaveAttribute(
      "aria-labelledby",
      userManual.id
    );
  });
});
