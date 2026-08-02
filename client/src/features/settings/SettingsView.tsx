import { KeyRound, Save } from "lucide-react";
import { useEffect, useState } from "react";

import { ConfirmDialog } from "../../shared/components/ConfirmDialog";
import type { LLMFeaturePreferences, RuntimeSettingsPublic } from "../../shared/types/api";

interface SettingsViewProps {
  settings: RuntimeSettingsPublic;
  onSessionKey: (apiKey: string) => Promise<void>;
  onPersistKey: (apiKey: string) => Promise<{ persisted: boolean }>;
  onLoadStoredKey: () => Promise<{ loaded: boolean }>;
  onResponseStorage: (mode: "normal" | "privacy") => Promise<void>;
  onPreferences: (preferences: Record<string, LLMFeaturePreferences>) => void;
  onConnectionTest: () => Promise<boolean>;
}

type ApiKeyAction = "session" | "keyring" | "load" | null;

export function SettingsView({
  settings,
  onSessionKey,
  onPersistKey,
  onLoadStoredKey,
  onResponseStorage,
  onPreferences,
  onConnectionTest
}: SettingsViewProps) {
  const [apiKey, setApiKey] = useState("");
  const [preferences, setPreferences] = useState(settings.feature_preferences);
  const [responseStorage, setResponseStorage] = useState(settings.response_storage);
  const [pendingResponseStorage, setPendingResponseStorage] = useState<"normal" | "privacy" | null>(null);
  const [keyStatus, setKeyStatus] = useState<string | null>(null);
  const [privacyStatus, setPrivacyStatus] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [apiKeyAction, setApiKeyAction] = useState<ApiKeyAction>(null);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  useEffect(() => {
    setPreferences(settings.feature_preferences);
  }, [settings.feature_preferences]);

  useEffect(() => {
    setResponseStorage(settings.response_storage);
  }, [settings.response_storage]);

  const updateVocabularyAmount = (featureId: string, value: string) => {
    setPreferences({
      ...preferences,
      [featureId]: { vocabulary_amount: value }
    });
  };

  const hasApiKey = apiKey.trim().length > 0;
  const isRealApiMode = settings.llm_mode === "real";
  const isApplyingKey = apiKeyAction !== null;

  async function applyApiKey(kind: "session" | "keyring"): Promise<void> {
    if (!hasApiKey || isApplyingKey) {
      return;
    }
    setApiKeyAction(kind);
    setKeyStatus(null);
    try {
      if (kind === "session") {
        await onSessionKey(apiKey.trim());
        setKeyStatus("このセッションにのみAPI keyを適用しました。入力欄は消去しました。");
      } else {
        const result = await onPersistKey(apiKey.trim());
        setKeyStatus(
          result.persisted
            ? "OS資格情報ストアに保存し、このセッションへ適用しました。入力欄は消去しました。"
            : "OS資格情報ストアを利用できないため、このセッションにのみ適用しました。入力欄は消去しました。"
        );
      }
      setApiKey("");
    } catch {
      setKeyStatus("適用できませんでした。入力内容は保持しています。接続と設定を確認して再試行してください。");
    } finally {
      setApiKeyAction(null);
    }
  }

  async function loadStoredApiKey(): Promise<void> {
    if (isApplyingKey) {
      return;
    }
    setApiKeyAction("load");
    setKeyStatus(null);
    try {
      const result = await onLoadStoredKey();
      setKeyStatus(
        result.loaded
          ? "OS資格情報ストアから読み込み、このセッションに適用しました。キーの値は表示しません。"
          : "保存済みのAPI keyが見つからないか、OS資格情報ストアを利用できません。設定は変更していません。"
      );
      if (result.loaded) {
        setApiKey("");
      }
    } catch {
      setKeyStatus("OS資格情報ストアから読み込めませんでした。設定は変更していません。保存またはセッション適用を使って再試行してください。");
    } finally {
      setApiKeyAction(null);
    }
  }

  async function confirmResponseStorage(): Promise<void> {
    if (!pendingResponseStorage || isSavingPrivacy) {
      return;
    }
    setIsSavingPrivacy(true);
    setPrivacyStatus(null);
    try {
      await onResponseStorage(pendingResponseStorage);
      setResponseStorage(pendingResponseStorage);
      setPrivacyStatus(
        pendingResponseStorage === "privacy"
          ? "Privacy modeを保存しました。以後の実API呼び出しでは応答保存と前回応答IDの継続を使いません。"
          : "通常の応答保存ポリシーを保存しました。"
      );
      setPendingResponseStorage(null);
    } catch {
      setPrivacyStatus("保存できませんでした。設定は変更していません。接続を確認して再試行してください。");
    } finally {
      setIsSavingPrivacy(false);
    }
  }

  async function testConnection(): Promise<void> {
    if (!isRealApiMode || !settings.api_key_configured || isTestingConnection) {
      return;
    }
    setIsTestingConnection(true);
    setConnectionStatus(null);
    try {
      const ok = await onConnectionTest();
      setConnectionStatus(
        ok
          ? "実APIへの接続を確認しました。キーの値や応答内容は画面に表示しません。"
          : "接続を確認できませんでした。API keyとネットワークを確認して再試行してください。"
      );
    } catch {
      setConnectionStatus("接続を確認できませんでした。API keyとネットワークを確認して再試行してください。");
    } finally {
      setIsTestingConnection(false);
    }
  }

  return (
    <section className="workspace-pane" aria-label="Settings">
      <div className="section-header">
        <h1>Settings</h1>
        <button type="button" onClick={() => onPreferences(preferences)}>
          <Save size={16} /> 語彙設定を保存
        </button>
      </div>

      <section className="plain-panel">
        <h2>API Key</h2>
        <label htmlFor="api-key">OpenAI API key</label>
        <p id="api-key-help">API keyの値は画面に保存せず、適用後に入力欄から消去します。</p>
        <div className="inline-form">
          <input
            id="api-key"
            type="password"
            value={apiKey}
            autoComplete="off"
            aria-describedby="api-key-help"
            onChange={(event) => setApiKey(event.currentTarget.value)}
          />
          <button
            type="button"
            className="secondary"
            disabled={!hasApiKey || isApplyingKey}
            onClick={() => void applyApiKey("session")}
          >
            <KeyRound size={16} /> このセッションだけで使用
          </button>
          <button type="button" disabled={!hasApiKey || isApplyingKey} onClick={() => void applyApiKey("keyring")}>
            <KeyRound size={16} /> OS資格情報ストアへ保存
          </button>
          <button
            type="button"
            className="secondary"
            disabled={isApplyingKey}
            aria-busy={apiKeyAction === "load"}
            onClick={() => void loadStoredApiKey()}
          >
            <KeyRound size={16} />
            {apiKeyAction === "load" ? "OS資格情報ストアを確認中…" : "OS資格情報ストアから読み込んで使用"}
          </button>
          <button
            type="button"
            className="secondary"
            disabled={!isRealApiMode || !settings.api_key_configured || isTestingConnection}
            onClick={() => void testConnection()}
          >
            実APIへの接続をテスト
          </button>
        </div>
        <p>このセッションだけで使用: アプリを閉じるまでメモリ内で利用し、OS資格情報ストアやローカルDBには保存しません。</p>
        <p>OS資格情報ストアへ保存: 利用可能な場合のみOSの資格情報ストアへ保存し、利用できない場合はこのセッションだけで使用します。</p>
        <p>OS資格情報ストアから読み込んで使用: 保存済みのAPI keyをこのセッションへ適用します。キーの値は画面やAPI応答へ返しません。</p>
        <p>
          {isRealApiMode
            ? settings.api_key_configured
              ? "実APIモードです。接続テストは現在のセッションの設定を使います。"
              : "実APIモードですが、API keyは未設定です。"
            : "Mock LLMモードです。外部APIへの接続・送信は行わず、接続テストは無効です。"}
        </p>
        {keyStatus ? <p role="status" aria-live="polite">{keyStatus}</p> : null}
        {connectionStatus ? <p role="status" aria-live="polite">{connectionStatus}</p> : null}
      </section>

      <section className="plain-panel">
        <h2>Privacy</h2>
        <p>
          Privacy modeは今後の実API呼び出しで応答保存を無効にし、前回応答IDを使った継続を送信しません。設定はローカルに保存され、次回起動後も継続します。既存のローカルデータや送信済みの内容は削除しません。
        </p>
        <label className="switch-row">
          <input
            type="checkbox"
            checked={responseStorage === "privacy"}
            onChange={(event) => {
              const mode = event.currentTarget.checked ? "privacy" : "normal";
              setPendingResponseStorage(mode);
            }}
          />
          <span>Privacy modeを有効にする</span>
        </label>
        {privacyStatus ? <p role="status" aria-live="polite">{privacyStatus}</p> : null}
      </section>

      <section className="plain-panel">
        <h2>Generation Service Profile</h2>
        <p>{settings.ruleset.display_name}</p>
      </section>

      <section className="plain-panel">
        <h2>AI execution profile</h2>
        <dl className="execution-profile" aria-label="AI execution profile">
          <div>
            <dt>Model</dt>
            <dd>{displayModel(settings.effective_model)}</dd>
          </div>
          <div>
            <dt>Reasoning</dt>
            <dd>{displayValue(settings.effective_reasoning_effort)}</dd>
          </div>
          <div>
            <dt>Response detail</dt>
            <dd>{displayValue(settings.effective_text_verbosity)}</dd>
          </div>
        </dl>
        <p>この実行構成は全AI機能と接続テストで共通です。</p>
      </section>

      <section className="plain-panel">
        <h2>Feature vocabulary preferences</h2>
        <div className="profiles-grid">
          {Object.entries(preferences).map(([featureId, preference]) => (
            <article className="profile-row" key={featureId}>
              <strong>{settings.feature_display_names[featureId] ?? featureId}</strong>
              <select
                aria-label={`${settings.feature_display_names[featureId] ?? featureId} vocabulary amount`}
                value={preference.vocabulary_amount}
                onChange={(event) =>
                  updateVocabularyAmount(featureId, event.currentTarget.value)
                }
              >
                {settings.vocabulary_amounts.map((amount) => (
                  <option key={amount} value={amount}>
                    {settings.vocabulary_amount_labels[amount] ?? amount}
                  </option>
                ))}
              </select>
            </article>
          ))}
        </div>
      </section>
      <ConfirmDialog
        open={pendingResponseStorage !== null}
        title={pendingResponseStorage === "privacy" ? "Privacy modeを有効にしますか？" : "通常の応答保存ポリシーに戻しますか？"}
        description={
          pendingResponseStorage === "privacy"
            ? "以後の実API呼び出しで応答保存を無効にし、前回応答IDを送信しません。設定はローカルに保存されます。既存データは削除されません。"
            : "以後の実API呼び出しで通常の応答保存ポリシーに戻します。設定はローカルに保存されます。"
        }
        confirmLabel={pendingResponseStorage === "privacy" ? "Privacy modeを有効にする" : "通常モードへ戻す"}
        onConfirm={() => void confirmResponseStorage()}
        onCancel={() => setPendingResponseStorage(null)}
      >
        <p>キャンセルすると設定は変更されません。</p>
      </ConfirmDialog>
    </section>
  );
}

function displayModel(model: string): string {
  const [family, version, ...nameParts] = model.split("-");
  if (family.toLowerCase() !== "gpt" || !version) {
    return model;
  }
  const name = nameParts.map(displayValue).join(" ");
  return [`GPT-${version}`, name].filter(Boolean).join(" ");
}

function displayValue(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
