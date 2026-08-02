import pytest

from mj_prompt_studio.app.app_context import AppContext
from mj_prompt_studio.config import (
    LEGACY_LLM_FEATURE_PROFILES_SETTING_KEY,
    LLM_FEATURE_PREFERENCES_SETTING_KEY,
    LLMFeaturePreferences,
    RuntimeSettings,
)
from mj_prompt_studio.infra.secret_store import APIKeyResolution, SecretStore
from mj_prompt_studio.infra.sqlite_repository import SQLiteRepository
from mj_prompt_studio.llm.orchestrator import LLMExecutionError


def _settings(tmp_path) -> RuntimeSettings:
    return RuntimeSettings(
        data_dir=tmp_path,
        llm_mode="mock",
        response_storage="normal",
    )


def test_app_context_migrates_legacy_profiles_idempotently(tmp_path) -> None:
    repository = SQLiteRepository(tmp_path / "mj_prompt_studio.sqlite3")
    repository.set_setting(
        LEGACY_LLM_FEATURE_PROFILES_SETTING_KEY,
        {
            "PromptDoctorAgent": {
                "model": "gpt-5.4-mini",
                "reasoning_effort": "medium",
                "vocabulary_amount": "rich",
            },
            "UnknownAgent": {"vocabulary_amount": "rich"},
        },
    )

    context = AppContext(_settings(tmp_path))
    preference = context.settings.feature_preferences_for("PromptDoctorAgent")
    migrated = context.repository.get_setting(LLM_FEATURE_PREFERENCES_SETTING_KEY)

    assert preference == LLMFeaturePreferences(vocabulary_amount="rich")
    assert migrated["PromptDoctorAgent"] == {"vocabulary_amount": "rich"}
    assert "model" not in migrated["PromptDoctorAgent"]
    assert "reasoning_effort" not in migrated["PromptDoctorAgent"]
    assert (
        context.repository.get_setting(
            LEGACY_LLM_FEATURE_PROFILES_SETTING_KEY, None
        )
        is None
    )
    context.shutdown()

    reloaded = AppContext(_settings(tmp_path))
    assert (
        reloaded.repository.get_setting(LLM_FEATURE_PREFERENCES_SETTING_KEY)
        == migrated
    )
    reloaded.shutdown()


def test_app_context_persists_vocabulary_preferences(tmp_path) -> None:
    context = AppContext(_settings(tmp_path))
    context.set_llm_feature_preferences(
        {
            "PromptDoctorAgent": LLMFeaturePreferences(vocabulary_amount="rich"),
        }
    )
    context.shutdown()

    reloaded = AppContext(_settings(tmp_path))
    assert (
        reloaded.settings.feature_preferences_for(
            "PromptDoctorAgent"
        ).vocabulary_amount
        == "rich"
    )
    reloaded.shutdown()


def test_app_context_recovers_from_corrupted_persisted_preferences(tmp_path) -> None:
    repository = SQLiteRepository(tmp_path / "mj_prompt_studio.sqlite3")
    repository.set_setting(LLM_FEATURE_PREFERENCES_SETTING_KEY, {})
    with repository.connect() as connection:
        connection.execute(
            "UPDATE settings SET value_json = ? WHERE key = ?",
            ("{broken", LLM_FEATURE_PREFERENCES_SETTING_KEY),
        )

    context = AppContext(_settings(tmp_path))

    assert (
        context.settings.feature_preferences_for(
            "VocabularyAgent"
        ).vocabulary_amount
        == "standard"
    )
    context.shutdown()


def test_app_context_uses_a_stored_key_during_startup_before_selecting_backend(
    tmp_path, monkeypatch
) -> None:
    monkeypatch.setattr(
        SecretStore,
        "resolve_openai_api_key",
        lambda self: APIKeyResolution("stored-key", "credential_store", "available"),
    )

    context = AppContext(
        RuntimeSettings(data_dir=tmp_path, llm_mode="real", response_storage="normal")
    )

    assert context.orchestrator.execution_backend == "openai"
    assert context.api_key_source == "credential_store"
    assert context.credential_store_status == "available"
    context.shutdown()


def test_app_context_requires_an_api_key_in_normal_mode_before_creating_jobs(
    tmp_path, monkeypatch
) -> None:
    monkeypatch.setattr(
        SecretStore,
        "resolve_openai_api_key",
        lambda self: APIKeyResolution(None, "not_configured", "not_configured"),
    )
    context = AppContext(
        RuntimeSettings(data_dir=tmp_path, llm_mode="real", response_storage="normal")
    )

    assert context.orchestrator.execution_backend == "unavailable"
    with pytest.raises(LLMExecutionError, match="API key") as exc_info:
        context.submit_agent_job("VocabularyAgent", {}, lambda: {})
    assert exc_info.value.code == "api_key_missing"
    assert context.job_queue.list_jobs() == []
    context.shutdown()


def test_app_context_keeps_explicit_mock_mode_when_a_key_is_present(tmp_path, monkeypatch) -> None:
    monkeypatch.setattr(
        SecretStore,
        "resolve_openai_api_key",
        lambda self: APIKeyResolution("stored-key", "credential_store", "available"),
    )
    context = AppContext(
        RuntimeSettings(data_dir=tmp_path, llm_mode="mock", response_storage="normal")
    )

    assert context.orchestrator.execution_backend == "mock"
    assert context.orchestrator.api_key == "stored-key"
    context.shutdown()
