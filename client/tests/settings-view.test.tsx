import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SettingsView } from "../src/features/settings/SettingsView";
import type { RuntimeSettingsPublic } from "../src/shared/types/api";

const settings: RuntimeSettingsPublic = {
  llm_mode: "mock",
  response_storage: "normal",
  privacy_mode: false,
  api_key_configured: false,
  feature_preferences: {
    VocabularyAgent: { vocabulary_amount: "standard" }
  },
  feature_display_names: { VocabularyAgent: "語彙補助" },
  effective_model: "gpt-5.6-luna",
  effective_reasoning_effort: "high",
  effective_text_verbosity: "low",
  vocabulary_amounts: ["compact", "standard", "rich"],
  vocabulary_amount_labels: {
    compact: "少なめ",
    standard: "標準",
    rich: "多め"
  },
  ruleset: {
    display_name: "Standard Ruleset",
    ui_expose_identifier: false,
    capabilities: {},
    parameters: [],
    reference_modes: []
  }
};

describe("SettingsView", () => {
  it("shows the fixed AI profile without model or reasoning selectors", () => {
    render(
      <SettingsView
        settings={settings}
        onSessionKey={vi.fn()}
        onPersistKey={vi.fn()}
        onLoadStoredKey={vi.fn()}
        onResponseStorage={vi.fn()}
        onPreferences={vi.fn()}
        onConnectionTest={vi.fn()}
      />
    );

    expect(screen.getByText("GPT-5.6 Luna")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("Low")).toBeInTheDocument();
    expect(screen.getAllByRole("combobox")).toHaveLength(1);
    expect(
      screen.getByRole("combobox", { name: "語彙補助 vocabulary amount" })
    ).toBeInTheDocument();
  });

  it("saves vocabulary preferences only", () => {
    const onPreferences = vi.fn();
    render(
      <SettingsView
        settings={settings}
        onSessionKey={vi.fn()}
        onPersistKey={vi.fn()}
        onLoadStoredKey={vi.fn()}
        onResponseStorage={vi.fn()}
        onPreferences={onPreferences}
        onConnectionTest={vi.fn()}
      />
    );

    fireEvent.change(
      screen.getByRole("combobox", { name: "語彙補助 vocabulary amount" }),
      { target: { value: "rich" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /語彙設定を保存/ }));

    expect(onPreferences).toHaveBeenCalledWith({
      VocabularyAgent: { vocabulary_amount: "rich" }
    });
  });

  it("labels the API key field, blocks blank values, and clears it after a session-only apply", async () => {
    const onSessionKey = vi.fn().mockResolvedValue(undefined);
    render(
      <SettingsView
        settings={settings}
        onSessionKey={onSessionKey}
        onPersistKey={vi.fn()}
        onLoadStoredKey={vi.fn()}
        onResponseStorage={vi.fn()}
        onPreferences={vi.fn()}
        onConnectionTest={vi.fn()}
      />
    );

    const apiKey = screen.getByLabelText("OpenAI API key");
    const sessionButton = screen.getByRole("button", { name: "このセッションだけで使用" });
    expect(apiKey).toHaveAttribute("aria-describedby", "api-key-help");
    expect(sessionButton).toBeDisabled();

    fireEvent.change(apiKey, { target: { value: "x" } });
    fireEvent.click(sessionButton);

    await waitFor(() => expect(onSessionKey).toHaveBeenCalledWith("x"));
    await waitFor(() => expect(apiKey).toHaveValue(""));
    expect(screen.getByText("このセッションにのみAPI keyを適用しました。入力欄は消去しました。")).toHaveAttribute("role", "status");
  });

  it("loads a stored key into the session without displaying its value", async () => {
    const onLoadStoredKey = vi.fn().mockResolvedValue({ loaded: true });
    render(
      <SettingsView
        settings={settings}
        onSessionKey={vi.fn()}
        onPersistKey={vi.fn()}
        onLoadStoredKey={onLoadStoredKey}
        onResponseStorage={vi.fn()}
        onPreferences={vi.fn()}
        onConnectionTest={vi.fn()}
      />
    );

    const apiKey = screen.getByLabelText("OpenAI API key");
    fireEvent.change(apiKey, { target: { value: "manual-key" } });
    fireEvent.click(screen.getByRole("button", { name: "OS資格情報ストアから読み込んで使用" }));

    await waitFor(() => expect(onLoadStoredKey).toHaveBeenCalledTimes(1));
    expect(
      screen.getByText("OS資格情報ストアから読み込み、このセッションに適用しました。キーの値は表示しません。")
    ).toHaveAttribute("role", "status");
    expect(apiKey).toHaveValue("");
    expect(document.body).not.toHaveTextContent("stored-key");
  });

  it("explains that a missing stored key leaves the current session unchanged", async () => {
    const onLoadStoredKey = vi.fn().mockResolvedValue({ loaded: false });
    render(
      <SettingsView
        settings={settings}
        onSessionKey={vi.fn()}
        onPersistKey={vi.fn()}
        onLoadStoredKey={onLoadStoredKey}
        onResponseStorage={vi.fn()}
        onPreferences={vi.fn()}
        onConnectionTest={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "OS資格情報ストアから読み込んで使用" }));

    await waitFor(() =>
      expect(
        screen.getByText("保存済みのAPI keyが見つからないか、OS資格情報ストアを利用できません。設定は変更していません。")
      ).toHaveAttribute("role", "status")
    );
  });

  it("keeps the existing settings path available when stored-key loading fails", async () => {
    const onLoadStoredKey = vi.fn().mockRejectedValue(new Error("credential store unavailable"));
    render(
      <SettingsView
        settings={settings}
        onSessionKey={vi.fn()}
        onPersistKey={vi.fn()}
        onLoadStoredKey={onLoadStoredKey}
        onResponseStorage={vi.fn()}
        onPreferences={vi.fn()}
        onConnectionTest={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "OS資格情報ストアから読み込んで使用" }));

    await waitFor(() =>
      expect(
        screen.getByText("OS資格情報ストアから読み込めませんでした。設定は変更していません。保存またはセッション適用を使って再試行してください。")
      ).toHaveAttribute("role", "status")
    );
  });

  it("does not claim that credential-store loading is in progress during session apply", async () => {
    let resolveSessionKey: (() => void) | undefined;
    const onSessionKey = vi.fn(
      () => new Promise<void>((resolve) => {
        resolveSessionKey = resolve;
      })
    );
    render(
      <SettingsView
        settings={settings}
        onSessionKey={onSessionKey}
        onPersistKey={vi.fn()}
        onLoadStoredKey={vi.fn()}
        onResponseStorage={vi.fn()}
        onPreferences={vi.fn()}
        onConnectionTest={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText("OpenAI API key"), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: "このセッションだけで使用" }));

    await waitFor(() => expect(onSessionKey).toHaveBeenCalledWith("x"));
    expect(screen.getByRole("button", { name: "OS資格情報ストアから読み込んで使用" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "OS資格情報ストアを確認中…" })).not.toBeInTheDocument();

    resolveSessionKey?.();
    await waitFor(() => expect(screen.getByLabelText("OpenAI API key")).toHaveValue(""));
  });

  it("requires confirmation before persisting Privacy mode and keeps the setting unchanged on cancel", async () => {
    const onResponseStorage = vi.fn().mockResolvedValue(undefined);
    render(
      <SettingsView
        settings={settings}
        onSessionKey={vi.fn()}
        onPersistKey={vi.fn()}
        onLoadStoredKey={vi.fn()}
        onResponseStorage={onResponseStorage}
        onPreferences={vi.fn()}
        onConnectionTest={vi.fn()}
      />
    );

    const privacySwitch = screen.getByRole("checkbox", { name: "Privacy modeを有効にする" });
    fireEvent.click(privacySwitch);
    expect(screen.getByRole("dialog", { name: "Privacy modeを有効にしますか？" })).toBeInTheDocument();
    expect(privacySwitch).not.toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(onResponseStorage).not.toHaveBeenCalled();
    expect(privacySwitch).not.toBeChecked();

    fireEvent.click(privacySwitch);
    fireEvent.click(screen.getByRole("button", { name: "Privacy modeを有効にする" }));
    await waitFor(() => expect(onResponseStorage).toHaveBeenCalledWith("privacy"));
    await waitFor(() => expect(privacySwitch).toBeChecked());
    expect(screen.getByText(/以後の実API呼び出しでは応答保存と前回応答IDの継続を使いません。/)).toHaveAttribute("role", "status");
  });
});
