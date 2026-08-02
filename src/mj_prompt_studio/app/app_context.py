from __future__ import annotations

from collections.abc import Callable
from dataclasses import replace
from pathlib import Path
from typing import Any

from mj_prompt_studio.application.prompt_workshop_service import PromptWorkshopService
from mj_prompt_studio.application.services import (
    ExportService,
    MatrixWorkflowService,
    PromptWorkflowService,
    ReferenceWorkflowService,
    ResultReviewWorkflowService,
)
from mj_prompt_studio.config import (
    LEGACY_LLM_FEATURE_PROFILES_SETTING_KEY,
    LLM_FEATURE_PREFERENCES_SETTING_KEY,
    LLMFeaturePreferences,
    RuntimeSettings,
    load_runtime_settings,
    read_openai_api_key_from_environment,
    serialize_feature_preferences,
)
from mj_prompt_studio.domain.prompt_document import PromptDocument
from mj_prompt_studio.domain.prompt_workshop import (
    normalize_exclusion_terms_for_storage,
    validate_exclusion_terms,
)
from mj_prompt_studio.infra.asset_store import AssetStore
from mj_prompt_studio.infra.ruleset_loader import load_standard_ruleset
from mj_prompt_studio.infra.secret_store import SecretStore
from mj_prompt_studio.infra.settings_store import SettingsStore
from mj_prompt_studio.infra.sqlite_repository import ProjectRecord, SQLiteRepository
from mj_prompt_studio.llm.job_queue import JobCallable, JobCallback, LLMJob, LLMJobQueue
from mj_prompt_studio.llm.orchestrator import LLMOrchestrator


class AppContext:
    def __init__(self, settings: RuntimeSettings | None = None) -> None:
        self.settings = settings or load_runtime_settings()
        self.settings.data_dir.mkdir(parents=True, exist_ok=True)
        self.db_path = self.settings.data_dir / "mj_prompt_studio.sqlite3"
        self.repository = SQLiteRepository(self.db_path)
        self.asset_store = AssetStore(self.settings.data_dir / "assets")
        self.settings_store = SettingsStore(self.settings.data_dir / "settings.json")
        self.secret_store = SecretStore()
        self.ruleset = load_standard_ruleset()
        self.settings = self._load_persisted_llm_settings(self.settings)
        api_key = (
            self.secret_store.read_openai_api_key() or read_openai_api_key_from_environment()
        )
        self.orchestrator = LLMOrchestrator(self.settings, api_key)
        self.job_queue = LLMJobQueue(
            max_workers=self.settings.max_parallel_jobs, on_change=self._persist_job
        )
        self._rebuild_services()
        self.export_service = ExportService()

    def set_session_api_key(self, api_key: str | None) -> None:
        effective_settings = replace(self.settings, llm_mode="real") if api_key else self.settings
        self.orchestrator = LLMOrchestrator(effective_settings, api_key or None)
        self.settings = effective_settings
        self._rebuild_services()

    def load_stored_api_key(self) -> bool:
        api_key = self.secret_store.read_openai_api_key_from_keyring()
        if not api_key:
            return False
        self.set_session_api_key(api_key)
        return True

    def set_llm_feature_preferences(
        self, preferences: dict[str, LLMFeaturePreferences]
    ) -> None:
        serialized = serialize_feature_preferences(preferences)
        self.repository.set_setting(LLM_FEATURE_PREFERENCES_SETTING_KEY, serialized)
        self.settings = self.settings.with_feature_preferences(serialized)
        self.orchestrator = LLMOrchestrator(self.settings, self.orchestrator.api_key)
        self._rebuild_services()

    def _rebuild_services(self) -> None:
        self.prompt_service = PromptWorkflowService(
            self.repository,
            self.ruleset,
            self.orchestrator,
            include_midjourney_options=(
                self.settings.include_midjourney_options_in_text_output
            ),
        )
        self.reference_service = ReferenceWorkflowService(
            self.repository, self.asset_store, self.orchestrator
        )
        self.matrix_service = MatrixWorkflowService(
            self.repository,
            self.orchestrator,
            include_midjourney_options=(
                self.settings.include_midjourney_options_in_text_output
            ),
        )
        self.workshop_service = PromptWorkshopService(
            self.orchestrator,
            self.ruleset,
            include_midjourney_options=(
                self.settings.include_midjourney_options_in_text_output
            ),
            exclusion_terms=self.settings.prompt_exclusion_terms,
        )
        self.result_review_service = ResultReviewWorkflowService(
            self.repository,
            self.asset_store,
            self.orchestrator,
            self.ruleset,
            include_midjourney_options=(
                self.settings.include_midjourney_options_in_text_output
            ),
        )

    def set_response_storage(self, response_storage: str) -> None:
        self.repository.set_setting("response_storage", response_storage)
        self.settings = replace(self.settings, response_storage=response_storage)
        self.orchestrator = LLMOrchestrator(self.settings, self.orchestrator.api_key)
        self._rebuild_services()

    def set_include_midjourney_options_in_text_output(self, include_options: bool) -> None:
        self.repository.set_setting("include_midjourney_options_in_text_output", include_options)
        self.settings = self.settings.with_prompt_output_preferences(
            include_midjourney_options_in_text_output=include_options,
            prompt_exclusion_terms=self.settings.prompt_exclusion_terms,
        )
        self._rebuild_services()
        self._rerender_all_prompt_documents()

    def set_prompt_exclusion_terms(self, terms: list[str]) -> None:
        normalized = tuple(validate_exclusion_terms(terms))
        self.repository.set_setting("prompt_exclusion_terms", list(normalized))
        self.settings = self.settings.with_prompt_output_preferences(
            include_midjourney_options_in_text_output=(
                self.settings.include_midjourney_options_in_text_output
            ),
            prompt_exclusion_terms=normalized,
        )
        self._rebuild_services()

    def ensure_workspace(self) -> tuple[ProjectRecord, PromptDocument]:
        return self.prompt_service.ensure_default_workspace()

    def submit_agent_job(
        self,
        agent_name: str,
        input_snapshot: dict[str, Any],
        work: JobCallable,
        callback: JobCallback | None = None,
    ) -> LLMJob:
        return self.job_queue.submit(
            agent_name=agent_name,
            input_snapshot=input_snapshot,
            work=work,
            callback=callback,
        )

    def export_to_file(self, path: Path, content_factory: Callable[[], str]) -> Path:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content_factory(), encoding="utf-8")
        return path

    def shutdown(self) -> None:
        self.job_queue.shutdown()

    def _persist_job(self, job: LLMJob) -> None:
        self.repository.save_job(job.id, job.agent_name, job.to_dict())

    def _load_persisted_llm_settings(self, settings: RuntimeSettings) -> RuntimeSettings:
        try:
            stored_preferences = self.repository.get_setting(
                LLM_FEATURE_PREFERENCES_SETTING_KEY, None
            )
            if stored_preferences is None:
                stored_preferences = self.repository.get_setting(
                    LEGACY_LLM_FEATURE_PROFILES_SETTING_KEY, {}
                )
        except (TypeError, ValueError):
            stored_preferences = {}
        try:
            stored_response_storage = self.repository.get_setting(
                "response_storage", settings.response_storage
            )
        except (TypeError, ValueError):
            stored_response_storage = settings.response_storage
        try:
            stored_include_options = self.repository.get_setting(
                "include_midjourney_options_in_text_output",
                settings.include_midjourney_options_in_text_output,
            )
            stored_exclusion_terms = self.repository.get_setting("prompt_exclusion_terms", [])
        except (TypeError, ValueError):
            stored_include_options = settings.include_midjourney_options_in_text_output
            stored_exclusion_terms = []
        if isinstance(stored_response_storage, str) and stored_response_storage in {
            "normal",
            "privacy",
        }:
            settings = replace(settings, response_storage=stored_response_storage)
        if not isinstance(stored_preferences, dict):
            stored_preferences = {}
        settings = settings.with_feature_preferences(stored_preferences)
        settings = settings.with_prompt_output_preferences(
            include_midjourney_options_in_text_output=(
                stored_include_options if isinstance(stored_include_options, bool) else True
            ),
            prompt_exclusion_terms=tuple(
                normalize_exclusion_terms_for_storage(stored_exclusion_terms)
            ),
        )
        self.repository.set_setting(
            LLM_FEATURE_PREFERENCES_SETTING_KEY,
            serialize_feature_preferences(settings.feature_preferences),
        )
        self.repository.delete_setting(LEGACY_LLM_FEATURE_PROFILES_SETTING_KEY)
        return settings

    def _rerender_all_prompt_documents(self) -> None:
        for project in self.repository.list_projects():
            for document in self.repository.list_prompt_documents(project.id):
                self.prompt_service.compile_document(
                    document,
                    source="output_policy",
                    diff_summary="テキストPrompt出力設定を反映",
                )
