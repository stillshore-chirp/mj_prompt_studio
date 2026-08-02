import tomllib
from pathlib import Path

import pytest

from mj_prompt_studio.config import (
    LLM_EXECUTION_POLICY,
    LLMFeaturePreferences,
    default_feature_preferences,
    load_runtime_settings,
    normalize_feature_preferences,
    read_openai_api_key_from_environment,
)
from mj_prompt_studio.domain.prompt_document import LLMContext
from mj_prompt_studio.infra.secret_store import SecretStore


def test_load_runtime_settings_uses_real_mode_when_terminal_api_key_exists(
    monkeypatch,
) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.delenv("MJPS_LLM_MODE", raising=False)

    settings = load_runtime_settings()

    assert settings.llm_mode == "real"
    assert read_openai_api_key_from_environment() == "test-key"


def test_load_runtime_settings_uses_real_mode_without_an_environment_key(monkeypatch) -> None:
    for name in ("OPENAI_API_KEY", "OPENAI_KEY", "MJPS_OPENAI_API_KEY", "MJPS_LLM_MODE"):
        monkeypatch.delenv(name, raising=False)

    settings = load_runtime_settings()

    assert settings.llm_mode == "real"


def test_explicit_mock_mode_overrides_terminal_api_key(monkeypatch) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("MJPS_LLM_MODE", "mock")

    settings = load_runtime_settings()

    assert settings.llm_mode == "mock"


def test_secret_store_reads_windows_or_shell_alias(monkeypatch) -> None:
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setenv("OPENAI_KEY", "alias-key")

    assert SecretStore().read_openai_api_key() == "alias-key"


def test_secret_store_can_read_keyring_without_environment_fallback(monkeypatch) -> None:
    class FakeKeyring:
        @staticmethod
        def get_password(service: str, account: str) -> str:
            assert service == "MJ Prompt Studio"
            assert account == "openai_api_key"
            return "stored-key"

    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_KEY", raising=False)
    monkeypatch.delenv("MJPS_OPENAI_API_KEY", raising=False)
    monkeypatch.setattr(
        "mj_prompt_studio.infra.secret_store._load_keyring", lambda: FakeKeyring
    )

    assert SecretStore().read_openai_api_key_from_keyring() == "stored-key"


def test_secret_store_reports_a_keyring_failure_without_returning_a_secret(monkeypatch) -> None:
    class FailingKeyring:
        @staticmethod
        def get_password(service: str, account: str) -> str:
            raise RuntimeError("credential store unavailable")

    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_KEY", raising=False)
    monkeypatch.delenv("MJPS_OPENAI_API_KEY", raising=False)
    monkeypatch.setattr(
        "mj_prompt_studio.infra.secret_store._load_keyring", lambda: FailingKeyring
    )

    resolution = SecretStore().resolve_openai_api_key()

    assert resolution.value is None
    assert resolution.source == "not_configured"
    assert resolution.credential_store_status == "unavailable"


def test_project_declares_keyring_for_supported_credential_store() -> None:
    project_root = Path(__file__).resolve().parents[1]
    pyproject = tomllib.loads((project_root / "pyproject.toml").read_text())

    assert "keyring>=25.0" in pyproject["project"]["dependencies"]


def test_execution_policy_is_luna_high_with_low_verbosity() -> None:
    assert LLM_EXECUTION_POLICY.model == "gpt-5.6-luna"
    assert LLM_EXECUTION_POLICY.reasoning_effort == "high"
    assert LLM_EXECUTION_POLICY.text_verbosity == "low"


def test_feature_preferences_only_control_vocabulary_amount() -> None:
    preferences = default_feature_preferences()

    assert all(
        preference == LLMFeaturePreferences(vocabulary_amount="standard")
        for preference in preferences.values()
    )


def test_feature_preference_normalization_migrates_legacy_profiles() -> None:
    preferences = normalize_feature_preferences(
        {
            "VocabularyAgent": {
                "model": "gpt-5.4-nano",
                "reasoning_effort": "none",
                "vocabulary_amount": "compact",
            },
            "PromptDoctorAgent": {
                "model": "gpt-5.4-mini",
                "reasoning_effort": "medium",
                "vocabulary_amount": "rich",
            },
            "PromptCompilerAgent": {"vocabulary_amount": "unknown"},
            "UnknownAgent": {"vocabulary_amount": "rich"},
        }
    )

    assert preferences["VocabularyAgent"].to_dict() == {
        "vocabulary_amount": "compact"
    }
    assert preferences["PromptDoctorAgent"].vocabulary_amount == "rich"
    assert preferences["PromptCompilerAgent"] == LLMFeaturePreferences()
    assert "UnknownAgent" not in preferences


def test_legacy_model_environment_is_ignored_with_warning(monkeypatch) -> None:
    monkeypatch.setenv("MJPS_MODEL_DEFAULT", "gpt-5.4-mini")
    monkeypatch.setenv("MJPS_MODEL_VISION", "gpt-5.6-sol")

    with pytest.warns(RuntimeWarning, match="ignored"):
        settings = load_runtime_settings()

    assert settings.feature_preferences == default_feature_preferences()
    assert LLM_EXECUTION_POLICY.model == "gpt-5.6-luna"


def test_saved_llm_context_preserves_legacy_model_boundary() -> None:
    context = LLMContext.from_dict(
        {
            "latest_response_id": "resp_legacy",
            "model": "gpt-5.4-mini",
            "reasoning_effort": "medium",
        }
    )

    assert context.model == "gpt-5.4-mini"
    assert context.reasoning_effort == "medium"
    assert context.text_verbosity == ""


def test_new_llm_context_uses_fixed_execution_policy() -> None:
    context = LLMContext()

    assert context.model == LLM_EXECUTION_POLICY.model
    assert context.reasoning_effort == LLM_EXECUTION_POLICY.reasoning_effort
    assert context.text_verbosity == LLM_EXECUTION_POLICY.text_verbosity
