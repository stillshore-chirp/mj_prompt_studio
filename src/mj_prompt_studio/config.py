from __future__ import annotations

import os
import warnings
from collections.abc import Mapping
from dataclasses import dataclass, field, replace
from pathlib import Path
from typing import Any

APP_NAME = "MJ Prompt Studio"
ENV_PREFIX = "MJPS_"
OPENAI_API_KEY_ENV_NAMES = ("OPENAI_API_KEY", "OPENAI_KEY", f"{ENV_PREFIX}OPENAI_API_KEY")
LLM_MODES = ("real", "mock")
LLM_FEATURE_PREFERENCES_SETTING_KEY = "llm_feature_preferences"
LEGACY_LLM_FEATURE_PROFILES_SETTING_KEY = "llm_feature_profiles"
LEGACY_MODEL_ENV_NAMES = (
    f"{ENV_PREFIX}MODEL_DEFAULT",
    f"{ENV_PREFIX}MODEL_INLINE",
    f"{ENV_PREFIX}MODEL_VISION",
    f"{ENV_PREFIX}MODEL_DEEP_REVIEW",
)

VOCABULARY_AMOUNTS = ("compact", "standard", "rich")
DEFAULT_VOCABULARY_AMOUNT = "standard"
VOCABULARY_AMOUNT_LABELS = {
    "compact": "少なめ",
    "standard": "標準",
    "rich": "多め",
}
LLM_FEATURE_IDS = (
    "IntentIntakeAgent",
    "VocabularyAgent",
    "PromptCompilerAgent",
    "PromptDoctorAgent",
    "ParameterAdvisorAgent",
    "ReferenceAnalyzerAgent",
    "MatrixPlannerAgent",
    "ResultReviewAgent",
    "FinalAuditorAgent",
)
LLM_FEATURE_DISPLAY_NAMES = {
    "IntentIntakeAgent": "AI Brief",
    "VocabularyAgent": "語彙補助",
    "PromptCompilerAgent": "Prompt Compiler",
    "PromptDoctorAgent": "Prompt Doctor",
    "ParameterAdvisorAgent": "Parameter Advisor",
    "ReferenceAnalyzerAgent": "Reference Analysis",
    "MatrixPlannerAgent": "Matrix Lab",
    "ResultReviewAgent": "Result Review",
    "FinalAuditorAgent": "Final Audit",
    "PromptGeneratorAgent": "Prompt Generator",
    "PromptTransformAgent": "Prompt Transform",
    "PromptLengthAdjustAgent": "文字数調整",
    "PromptArrangeAgent": "LLMアレンジ",
}


@dataclass(frozen=True)
class LLMExecutionPolicy:
    model: str = "gpt-5.6-luna"
    reasoning_effort: str = "high"
    text_verbosity: str = "low"


LLM_EXECUTION_POLICY = LLMExecutionPolicy()


@dataclass(frozen=True)
class LLMFeaturePreferences:
    vocabulary_amount: str = DEFAULT_VOCABULARY_AMOUNT

    def __post_init__(self) -> None:
        object.__setattr__(
            self,
            "vocabulary_amount",
            _validated_choice(
                str(self.vocabulary_amount),
                VOCABULARY_AMOUNTS,
                DEFAULT_VOCABULARY_AMOUNT,
            ),
        )

    @classmethod
    def from_dict(cls, data: Mapping[str, Any]) -> LLMFeaturePreferences:
        return cls(vocabulary_amount=str(data.get("vocabulary_amount", "")))

    def to_dict(self) -> dict[str, str]:
        return {"vocabulary_amount": self.vocabulary_amount}


@dataclass(frozen=True)
class RuntimeSettings:
    data_dir: Path
    llm_mode: str
    response_storage: str
    feature_preferences: dict[str, LLMFeaturePreferences] = field(
        default_factory=lambda: default_feature_preferences()
    )
    max_parallel_jobs: int = 3
    timeout_seconds: int = 120
    retry_count: int = 2
    include_midjourney_options_in_text_output: bool = True
    prompt_exclusion_terms: tuple[str, ...] = ()

    def __post_init__(self) -> None:
        object.__setattr__(
            self,
            "feature_preferences",
            normalize_feature_preferences(self.feature_preferences),
        )

    @property
    def privacy_mode(self) -> bool:
        return self.response_storage.lower() == "privacy"

    def feature_preferences_for(self, agent_name: str) -> LLMFeaturePreferences:
        return self.feature_preferences.get(agent_name, LLMFeaturePreferences())

    def with_feature_preferences(
        self, preferences: Mapping[str, LLMFeaturePreferences | Mapping[str, Any]]
    ) -> RuntimeSettings:
        return replace(
            self,
            feature_preferences=normalize_feature_preferences(preferences),
        )

    def with_prompt_output_preferences(
        self,
        *,
        include_midjourney_options_in_text_output: bool,
        prompt_exclusion_terms: tuple[str, ...],
    ) -> RuntimeSettings:
        return replace(
            self,
            include_midjourney_options_in_text_output=include_midjourney_options_in_text_output,
            prompt_exclusion_terms=prompt_exclusion_terms,
        )


def default_data_dir() -> Path:
    override = os.environ.get(f"{ENV_PREFIX}DATA_DIR")
    if override:
        return Path(override).expanduser()
    return Path.home() / "Library" / "Application Support" / "MJ Prompt Studio"


def load_runtime_settings() -> RuntimeSettings:
    _warn_about_legacy_model_environment()
    configured_llm_mode = os.environ.get(f"{ENV_PREFIX}LLM_MODE", "")
    return RuntimeSettings(
        data_dir=default_data_dir(),
        llm_mode=_configured_llm_mode(configured_llm_mode),
        response_storage=os.environ.get(f"{ENV_PREFIX}RESPONSE_STORAGE", "normal").lower(),
        max_parallel_jobs=int(os.environ.get(f"{ENV_PREFIX}MAX_PARALLEL_JOBS", "3")),
        timeout_seconds=int(os.environ.get(f"{ENV_PREFIX}TIMEOUT_SECONDS", "120")),
        retry_count=int(os.environ.get(f"{ENV_PREFIX}RETRY_COUNT", "2")),
    )


def read_openai_api_key_from_environment() -> str | None:
    for name in OPENAI_API_KEY_ENV_NAMES:
        value = os.environ.get(name)
        if value:
            return value
    return None


def _default_llm_mode() -> str:
    return "real"


def _configured_llm_mode(value: str) -> str:
    normalized = value.strip().lower()
    if not normalized:
        return _default_llm_mode()
    if normalized in LLM_MODES:
        return normalized
    warnings.warn(
        f"Unsupported {ENV_PREFIX}LLM_MODE={value!r}; using real mode. "
        "Use 'mock' only for an explicit test or demo run.",
        RuntimeWarning,
        stacklevel=2,
    )
    return _default_llm_mode()


def default_feature_preferences() -> dict[str, LLMFeaturePreferences]:
    return {feature_id: LLMFeaturePreferences() for feature_id in LLM_FEATURE_IDS}


def normalize_feature_preferences(
    preferences: Mapping[str, LLMFeaturePreferences | Mapping[str, Any]],
) -> dict[str, LLMFeaturePreferences]:
    normalized = default_feature_preferences()
    for feature_id, preference in preferences.items():
        if feature_id not in normalized:
            continue
        if isinstance(preference, LLMFeaturePreferences):
            normalized[feature_id] = LLMFeaturePreferences.from_dict(preference.to_dict())
        elif isinstance(preference, Mapping):
            normalized[feature_id] = LLMFeaturePreferences.from_dict(preference)
    return normalized


def serialize_feature_preferences(
    preferences: Mapping[str, LLMFeaturePreferences | Mapping[str, Any]],
) -> dict[str, dict[str, str]]:
    normalized = normalize_feature_preferences(preferences)
    return {feature_id: preference.to_dict() for feature_id, preference in normalized.items()}


def _warn_about_legacy_model_environment() -> None:
    configured = [name for name in LEGACY_MODEL_ENV_NAMES if os.environ.get(name)]
    if not configured:
        return
    joined = ", ".join(configured)
    warnings.warn(
        f"Legacy model environment variables are ignored: {joined}. "
        "Remove them; MJ Prompt Studio always uses GPT-5.6 Luna High.",
        RuntimeWarning,
        stacklevel=2,
    )


def _validated_choice(value: str, choices: tuple[str, ...], fallback: str) -> str:
    return value if value in choices else fallback
