import { KeyRound, Save } from "lucide-react";
import { useEffect, useState } from "react";

import { ConfirmDialog } from "../../shared/components/ConfirmDialog";
import { ScreenGuide } from "../../shared/components/ScreenGuide";
import type { LLMFeaturePreferences, RuntimeSettingsPublic } from "../../shared/types/api";
import { displayJobFailure, isLLMFailureCode } from "../../shared/utils/job-failure";

interface SettingsViewProps {
  settings: RuntimeSettingsPublic;
  onSessionKey: (apiKey: string) => Promise<void>;
  onPersistKey: (apiKey: string) => Promise<{ persisted: boolean }>;
  onLoadStoredKey: () => Promise<{ loaded: boolean }>;
  onResponseStorage: (mode: "normal" | "privacy") => Promise<void>;
  onTextOutputOptions: (includeOptions: boolean) => Promise<void>;
  onExclusionTerms: (terms: string[]) => Promise<void>;
  onPreferences: (preferences: Record<string, LLMFeaturePreferences>) => void;
  onConnectionTest: () => Promise<{ ok: boolean; errorCode: string | null }>;
}

type ApiKeyAction = "session" | "keyring" | "load" | null;

export function SettingsView({
  settings,
  onSessionKey,
  onPersistKey,
  onLoadStoredKey,
  onResponseStorage,
  onTextOutputOptions,
  onExclusionTerms,
  onPreferences,
  onConnectionTest
}: SettingsViewProps) {
  const [apiKey, setApiKey] = useState("");
  const [preferences, setPreferences] = useState(settings.feature_preferences);
  const [responseStorage, setResponseStorage] = useState(settings.response_storage);
  const [includeOptions, setIncludeOptions] = useState(
    settings.include_midjourney_options_in_text_output
  );
  const [termsText, setTermsText] = useState(settings.prompt_exclusion_terms.join("\n"));
  const [newTerm, setNewTerm] = useState("");
  const [pendingResponseStorage, setPendingResponseStorage] = useState<"normal" | "privacy" | null>(null);
  const [keyStatus, setKeyStatus] = useState<string | null>(null);
  const [privacyStatus, setPrivacyStatus] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [apiKeyAction, setApiKeyAction] = useState<ApiKeyAction>(null);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSavingTerms, setIsSavingTerms] = useState(false);
  const [termsStatus, setTermsStatus] = useState<string | null>(null);
  const [outputOptionsStatus, setOutputOptionsStatus] = useState<string | null>(null);
  const [pendingClearTerms, setPendingClearTerms] = useState(false);

  useEffect(() => {
    setPreferences(settings.feature_preferences);
  }, [settings.feature_preferences]);

  useEffect(() => {
    setResponseStorage(settings.response_storage);
  }, [settings.response_storage]);

  useEffect(() => {
    setIncludeOptions(settings.include_midjourney_options_in_text_output);
  }, [settings.include_midjourney_options_in_text_output]);

  useEffect(() => {
    setTermsText(settings.prompt_exclusion_terms.join("\n"));
  }, [settings.prompt_exclusion_terms]);

  const updateVocabularyAmount = (featureId: string, value: string) => {
    setPreferences({
      ...preferences,
      [featureId]: { vocabulary_amount: value }
    });
  };

  const hasApiKey = apiKey.trim().length > 0;
  const isRealApiMode = settings.execution_backend === "openai";
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
      const result = await onConnectionTest();
      setConnectionStatus(
        result.ok
          ? "実APIへの接続を確認しました。キーの値や応答内容は画面に表示しません。"
          : connectionFailureMessage(result.errorCode)
      );
    } catch {
      setConnectionStatus("接続を確認できませんでした。API keyとネットワークを確認して再試行してください。");
    } finally {
      setIsTestingConnection(false);
    }
  }

  async function saveOutputOptions(nextValue: boolean): Promise<void> {
    const previous = includeOptions;
    setIncludeOptions(nextValue);
    setOutputOptionsStatus(null);
    try {
      await onTextOutputOptions(nextValue);
      setOutputOptionsStatus("テキストPrompt出力の設定を保存しました。");
    } catch {
      setIncludeOptions(previous);
      setOutputOptionsStatus("保存できませんでした。設定は変更していません。再試行してください。");
    }
  }

  const splitTerms = (): string[] =>
    termsText
      .split("\n")
      .map((term) => term.trim())
      .filter(Boolean);

  function addTerm(): void {
    const term = newTerm.trim();
    if (!term) {
      return;
    }
    setTermsText((current) => [current.trim(), term].filter(Boolean).join("\n"));
    setNewTerm("");
  }

  async function saveTerms(nextTerms = splitTerms()): Promise<void> {
    setIsSavingTerms(true);
    setTermsStatus(null);
    try {
      await onExclusionTerms(nextTerms);
      setTermsText(nextTerms.join("\n"));
      setTermsStatus("除外語句を保存しました。次の創作系Prompt生成から反映されます。");
    } catch {
      setTermsStatus("保存できませんでした。入力内容を確認して再試行してください。");
    } finally {
      setIsSavingTerms(false);
    }
  }

  return (
    <section className="workspace-pane" aria-label="Settings">
      <ScreenGuide
        step="制作の準備（必要なとき）"
        title="AI支援の設定を確認する"
        featureName="Settings"
        description="実AIを使う場合のAPI key、現在の実行経路、Privacy、テキストPrompt出力、除外語句、語彙量を確認します。"
        whenToUse="実AIを使い始めるとき、AI処理の実行経路を確認したいとき、または保存・出力・除外語句の設定を変えたいとき。"
        actions={
          <button type="button" onClick={() => onPreferences(preferences)}>
          <Save size={16} /> 語彙設定を保存
          </button>
        }
      />

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
            aria-describedby="connection-test-help"
            onClick={() => void testConnection()}
          >
            実APIへの接続をテスト
          </button>
        </div>
        <p>このセッションだけで使用: アプリを閉じるまでメモリ内で利用し、OS資格情報ストアやローカルDBには保存しません。</p>
        <p>OS資格情報ストアへ保存: 利用可能な場合のみOSの資格情報ストアへ保存し、利用できない場合はこのセッションだけで使用します。</p>
        <p>OS資格情報ストアから読み込んで使用: 保存済みのAPI keyをこのセッションへ適用します。キーの値は画面やAPI応答へ返しません。</p>
        <p id="connection-test-help">実APIへの接続をテスト: API keyと基本的な接続だけを確認します。構造化の各AI処理や現在の応答保存設定まで成功することは保証しません。</p>
        <p>
          {executionStatusMessage(settings)}
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
        <h2>テキストPrompt出力</h2>
        <p>
          コピーとテキストexport、Prompt Workshopの結果へ、構造化されたMidjourneyオプションを付けるかを一括で切り替えます。OFFにしてもPromptParametersやJSON snapshotは保持されます。
        </p>
        <label className="switch-row">
          <input
            type="checkbox"
            checked={includeOptions}
            onChange={(event) => void saveOutputOptions(event.currentTarget.checked)}
          />
          <span>テキストPrompt出力にMidjourneyオプションを付ける</span>
        </label>
        {outputOptionsStatus ? <p role="status" aria-live="polite">{outputOptionsStatus}</p> : null}
      </section>

      <section className="plain-panel" aria-labelledby="exclusion-terms-title">
        <h2 id="exclusion-terms-title">Prompt除外語句</h2>
        <p>
          新しいPrompt生成、世界観整形、カオスミックス、LLMアレンジに適用します。文字数のみ調整と既存Promptの保存には適用しません。
        </p>
        <div className="inline-form">
          <label className="field">
            <span>語句を追加</span>
            <input
              value={newTerm}
              maxLength={settings.prompt_exclusion_term_max_length}
              onChange={(event) => setNewTerm(event.currentTarget.value)}
            />
          </label>
          <button type="button" className="secondary" onClick={addTerm}>
            追加
          </button>
        </div>
        <label className="field" htmlFor="prompt-exclusion-terms">
          <span>一括編集（1行1件）</span>
          <textarea
            id="prompt-exclusion-terms"
            value={termsText}
            rows={8}
            maxLength={20000}
            onChange={(event) => setTermsText(event.currentTarget.value)}
          />
        </label>
        <p>
          {splitTerms().length} / {settings.prompt_exclusion_term_limit}件。各語句は最大
          {settings.prompt_exclusion_term_max_length}文字です。
        </p>
        {splitTerms().length > 0 ? (
          <ul className="term-list" aria-label="現在の除外語句">
            {splitTerms().map((term, index) => (
              <li key={term + index}>
                <span>{term}</span>
                <button
                  type="button"
                  className="secondary"
                  onClick={() =>
                    setTermsText(
                      splitTerms()
                        .filter((_item, itemIndex) => itemIndex !== index)
                        .join("\n")
                    )
                  }
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="inline-form">
          <button type="button" disabled={isSavingTerms} onClick={() => void saveTerms()}>
            <Save size={16} /> 除外語句を保存
          </button>
          <button
            type="button"
            className="secondary"
            disabled={splitTerms().length === 0 || isSavingTerms}
            onClick={() => setPendingClearTerms(true)}
          >
            全て消去
          </button>
        </div>
        {termsStatus ? <p role="status" aria-live="polite">{termsStatus}</p> : null}
      </section>

      <section className="plain-panel">
        <h2>Generation Service Profile</h2>
        <p>{settings.ruleset.display_name}</p>
      </section>

      <section className="plain-panel">
        <h2>AI execution profile</h2>
        <dl className="execution-profile" aria-label="AI execution profile">
          <div>
            <dt>実行経路</dt>
            <dd>{executionBackendLabel(settings.execution_backend)}</dd>
          </div>
          <div>
            <dt>設定モード</dt>
            <dd>{settings.configured_mode === "mock" ? "Mock（明示設定）" : "実API"}</dd>
          </div>
          <div>
            <dt>API key</dt>
            <dd>{settings.api_key_configured ? "設定済み" : "未設定"}</dd>
          </div>
          <div>
            <dt>キーの取得元</dt>
            <dd>{apiKeySourceLabel(settings.api_key_source)}</dd>
          </div>
          <div>
            <dt>資格情報ストア</dt>
            <dd>{credentialStoreStatusLabel(settings.credential_store_status)}</dd>
          </div>
          <div>
            <dt>実行時モデル</dt>
            <dd>{settings.execution_backend === "openai" ? displayModel(settings.effective_model) : "実行なし"}</dd>
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
        <p>{executionProfileMessage(settings)}</p>
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
      <ConfirmDialog
        open={pendingClearTerms}
        title="除外語句をすべて消去しますか？"
        description="保存済みの除外語句をすべて削除します。以後のPrompt生成には適用されなくなります。"
        confirmLabel="すべて消去する"
        onConfirm={() => {
          setPendingClearTerms(false);
          void saveTerms([]);
        }}
        onCancel={() => setPendingClearTerms(false)}
      >
        <p>キャンセルすると除外語句は変更されません。</p>
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

function executionBackendLabel(backend: RuntimeSettingsPublic["execution_backend"]): string {
  if (backend === "openai") {
    return "OpenAI Responses API";
  }
  if (backend === "mock") {
    return "Mock（外部APIは呼びません）";
  }
  return "実行不可";
}

function apiKeySourceLabel(source: RuntimeSettingsPublic["api_key_source"]): string {
  if (source === "environment") {
    return "環境変数";
  }
  if (source === "credential_store") {
    return "OS資格情報ストア";
  }
  if (source === "session") {
    return "このセッション";
  }
  return "未設定";
}

function credentialStoreStatusLabel(
  status: RuntimeSettingsPublic["credential_store_status"]
): string {
  if (status === "available") {
    return "利用可能";
  }
  if (status === "unavailable") {
    return "利用不可";
  }
  if (status === "not_checked") {
    return "未確認";
  }
  return "保存済みキーなし";
}

function executionStatusMessage(settings: RuntimeSettingsPublic): string {
  if (settings.execution_backend === "openai") {
    return "実APIを使用できます。接続テストは現在のセッションの設定を使います。";
  }
  if (settings.execution_backend === "mock") {
    return "Mockモードは明示設定されています。外部APIへの接続・送信は行わず、接続テストは実行しません。";
  }
  if (settings.execution_error_code === "client_initialization_failed") {
    return "実APIの準備を完了できませんでした。API keyとアプリの設定を確認してから、もう一度実行してください。";
  }
  return "API keyが未設定のため、AI処理は実行できません。OS資格情報ストアから読み込むか、このセッションへ適用してください。";
}

function executionProfileMessage(settings: RuntimeSettingsPublic): string {
  if (settings.execution_backend === "openai") {
    return "この実行構成は全AI機能と接続テストで共通です。";
  }
  if (settings.execution_backend === "mock") {
    return "Mock実行では実モデルを呼びません。実APIを使うにはMockモードを解除して再起動してください。";
  }
  return "実行できるAIバックエンドがありません。API keyを設定すると、実API用の固定構成で実行します。";
}

function connectionFailureMessage(errorCode: string | null): string {
  if (errorCode === "mock_mode") {
    return "Mockモードでは実APIへの接続テストを実行しません。";
  }
  if (isLLMFailureCode(errorCode)) {
    const failure = displayJobFailure(errorCode);
    return `${failure.summary}${failure.recovery}`;
  }
  return "接続を確認できませんでした。API keyとネットワークを確認して再試行してください。";
}
