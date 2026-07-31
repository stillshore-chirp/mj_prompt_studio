import { KeyRound, Save } from "lucide-react";
import { useEffect, useState } from "react";

import type { LLMFeaturePreferences, RuntimeSettingsPublic } from "../../shared/types/api";

interface SettingsViewProps {
  settings: RuntimeSettingsPublic;
  onSessionKey: (apiKey: string) => void;
  onPersistKey: (apiKey: string) => void;
  onResponseStorage: (mode: "normal" | "privacy") => void;
  onPreferences: (preferences: Record<string, LLMFeaturePreferences>) => void;
  onConnectionTest: () => void;
}

export function SettingsView({
  settings,
  onSessionKey,
  onPersistKey,
  onResponseStorage,
  onPreferences,
  onConnectionTest
}: SettingsViewProps) {
  const [apiKey, setApiKey] = useState("");
  const [preferences, setPreferences] = useState(settings.feature_preferences);
  const [responseStorage, setResponseStorage] = useState(settings.response_storage);

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
        <div className="inline-form">
          <input
            type="password"
            value={apiKey}
            autoComplete="off"
            onChange={(event) => setApiKey(event.currentTarget.value)}
          />
          <button type="button" className="secondary" onClick={() => onSessionKey(apiKey)}>
            <KeyRound size={16} /> Session
          </button>
          <button type="button" onClick={() => onPersistKey(apiKey)}>
            <KeyRound size={16} /> Keyring
          </button>
          <button type="button" className="secondary" onClick={onConnectionTest}>
            Test
          </button>
        </div>
        <p>{settings.api_key_configured ? "API key configured" : "MockLLM mode"}</p>
      </section>

      <section className="plain-panel">
        <h2>Privacy</h2>
        <label className="switch-row">
          <input
            type="checkbox"
            checked={responseStorage === "privacy"}
            onChange={(event) => {
              const mode = event.currentTarget.checked ? "privacy" : "normal";
              setResponseStorage(mode);
              onResponseStorage(mode);
            }}
          />
          <span>Privacy mode</span>
        </label>
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
