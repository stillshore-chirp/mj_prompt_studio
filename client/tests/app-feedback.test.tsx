import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { App } from "../src/app/App";

const mocks = vi.hoisted(() => ({
  workspace: vi.fn(() => Promise.reject({ kind: "network" })),
  settings: vi.fn(() => Promise.resolve({ settings: {} })),
  promptArrangePresets: vi.fn(() => Promise.resolve({ presets: [], warning: null }))
}));

vi.mock("../src/shared/api/client", () => ({
  ApiClientError: class ApiClientError extends Error {},
  api: {
    workspace: mocks.workspace,
    settings: mocks.settings,
    promptArrangePresets: mocks.promptArrangePresets
  }
}));

describe("App boot feedback", () => {
  it("shows a safe, recoverable network error instead of leaving the boot screen blocked", async () => {
    render(<App />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "ローカルAPIに接続できません。ローカルAPIが起動しているか確認してから、再試行してください。"
    );
    expect(screen.getByText("プロジェクトと保存済みの内容はまだ読み込まれていません。")).toBeInTheDocument();
    expect(screen.queryByText("network")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "接続設定を確認する" }));
    expect(
      await screen.findByText("ローカルAPIへの接続を確認しました。再試行するとプロジェクトを読み込みます。")
    ).toHaveAttribute("role", "status");

    fireEvent.click(screen.getByRole("button", { name: "再試行する" }));
    await waitFor(() => expect(mocks.workspace).toHaveBeenCalledTimes(2));
    expect(mocks.settings).toHaveBeenCalledTimes(1);
  });
});
