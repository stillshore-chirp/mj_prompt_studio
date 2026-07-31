from mj_prompt_studio.app.app_context import AppContext
from mj_prompt_studio.config import (
    LEGACY_LLM_FEATURE_PROFILES_SETTING_KEY,
    LLM_FEATURE_PREFERENCES_SETTING_KEY,
    LLMFeaturePreferences,
    RuntimeSettings,
)
from mj_prompt_studio.infra.sqlite_repository import SQLiteRepository


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
