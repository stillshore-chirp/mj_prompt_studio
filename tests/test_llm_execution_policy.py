from pathlib import Path

import pytest

from mj_prompt_studio.app.app_context import AppContext
from mj_prompt_studio.config import LLM_EXECUTION_POLICY, RuntimeSettings
from mj_prompt_studio.llm.mock_client import MockLLMClient
from mj_prompt_studio.llm.openai_client import OpenAIResponse, TokenUsage
from mj_prompt_studio.llm.orchestrator import LLMExecutionError, LLMOrchestrator


def _settings(
    tmp_path: Path, response_storage: str = "normal", llm_mode: str = "mock"
) -> RuntimeSettings:
    return RuntimeSettings(
        data_dir=tmp_path,
        llm_mode=llm_mode,
        response_storage=response_storage,
    )


def test_document_continuation_stops_at_legacy_model_boundary(tmp_path: Path) -> None:
    context = AppContext(_settings(tmp_path))
    _project, document = context.ensure_workspace()
    document.llm_context.latest_response_id = "resp_legacy"
    document.llm_context.model = "gpt-5.4-mini"
    seen_previous_ids = []
    original_run_agent = context.orchestrator.run_agent

    def capture_run_agent(agent_name, payload, **kwargs):
        seen_previous_ids.append(kwargs.get("previous_response_id"))
        return original_run_agent(agent_name, payload, **kwargs)

    context.orchestrator.run_agent = capture_run_agent
    document, _result = context.prompt_service.build_from_brief(document, "朝食広告")

    assert seen_previous_ids == [None]
    assert document.llm_context.model == LLM_EXECUTION_POLICY.model
    assert document.llm_context.reasoning_effort == "high"
    assert document.llm_context.text_verbosity == "low"

    document.llm_context.latest_response_id = "resp_luna"
    context.prompt_service.run_prompt_doctor(document)
    assert seen_previous_ids[-1] == "resp_luna"
    context.shutdown()


class _CapturingResponsesClient:
    def __init__(self) -> None:
        self.calls = []
        self.delegate = MockLLMClient()

    def create_response(self, **kwargs):
        self.calls.append(kwargs)
        has_image = kwargs["input_payload"][0]["content"][-1]["type"] == "input_image"
        agent_name = "ReferenceAnalyzerAgent" if has_image else "VocabularyAgent"
        payload = self.delegate.create_agent_response(agent_name, {})
        return OpenAIResponse(
            output_json=payload.output_json,
            response_id="resp_luna",
            usage=TokenUsage(
                input_tokens=10,
                cached_input_tokens=2,
                output_tokens=5,
                reasoning_tokens=3,
            ),
            request_latency_ms=12.5,
        )


class _ProviderFailure(RuntimeError):
    def __init__(
        self,
        status_code: int,
        detail: str,
        provider_code: str | None = None,
        code_on_exception: bool = False,
    ) -> None:
        self.status_code = status_code
        self.body = {"error": {"message": detail}}
        if provider_code is not None:
            if code_on_exception:
                self.code = provider_code
            else:
                self.body["error"]["code"] = provider_code
        super().__init__(detail)


class _FailingResponsesClient:
    def __init__(
        self,
        status_code: int,
        detail: str,
        provider_code: str | None = None,
        code_on_exception: bool = False,
    ) -> None:
        self.error = _ProviderFailure(status_code, detail, provider_code, code_on_exception)

    def create_response(self, **_kwargs):
        raise self.error


def test_orchestrator_preserves_images_and_normal_continuation(tmp_path: Path) -> None:
    orchestrator = LLMOrchestrator(_settings(tmp_path, llm_mode="real"))
    client = _CapturingResponsesClient()
    orchestrator.real_client = client
    image_path = tmp_path / "reference.png"
    image_path.write_bytes(b"image")

    result = orchestrator.run_agent(
        "ReferenceAnalyzerAgent",
        {"name": "reference", "tags": []},
        previous_response_id="resp_previous",
        image_paths=[image_path],
    )

    assert client.calls[0]["previous_response_id"] == "resp_previous"
    assert client.calls[0]["store"] is True
    content = client.calls[0]["input_payload"][0]["content"]
    assert any(item["type"] == "input_image" for item in content)
    assert result.metrics.image_input_count == 1
    assert result.metrics.usage.reasoning_tokens == 3
    assert result.metrics.schema_valid is True


def test_privacy_mode_always_removes_continuation_id(tmp_path: Path) -> None:
    orchestrator = LLMOrchestrator(_settings(tmp_path, response_storage="privacy", llm_mode="real"))
    client = _CapturingResponsesClient()
    orchestrator.real_client = client

    orchestrator.run_agent(
        "VocabularyAgent",
        {"text": "上質"},
        previous_response_id="resp_luna",
    )

    assert client.calls[0]["previous_response_id"] is None
    assert client.calls[0]["store"] is False


@pytest.mark.parametrize(
    ("status_code", "detail", "provider_code", "code_on_exception", "expected_code"),
    [
        (
            400,
            "provider diagnostic: invalid response_format schema",
            None,
            False,
            "structured_output_schema_invalid",
        ),
        (
            400,
            "provider diagnostic: store setting is not accepted",
            None,
            False,
            "response_storage_rejected",
        ),
        (429, "provider diagnostic: too many requests", None, False, "rate_limited"),
        (
            429,
            "provider diagnostic: quota",
            "credit_balance_exhausted",
            False,
            "api_quota_exhausted",
        ),
        (
            429,
            "provider diagnostic: quota",
            "organization_spend_limit_exceeded",
            False,
            "api_quota_exhausted",
        ),
        (
            429,
            "provider diagnostic: quota",
            "project_spend_limit_exceeded",
            False,
            "api_quota_exhausted",
        ),
        (
            429,
            "provider diagnostic: quota",
            "organization_usage_limit_exceeded",
            False,
            "api_quota_exhausted",
        ),
        (429, "provider diagnostic: quota", "insufficient_quota", False, "api_quota_exhausted"),
        (429, "provider diagnostic: quota", "insufficient_quota", True, "api_quota_exhausted"),
    ],
)
def test_orchestrator_classifies_provider_failures_without_exposing_raw_detail(
    tmp_path: Path,
    status_code: int,
    detail: str,
    provider_code: str | None,
    code_on_exception: bool,
    expected_code: str,
) -> None:
    orchestrator = LLMOrchestrator(_settings(tmp_path, llm_mode="real"))
    orchestrator.real_client = _FailingResponsesClient(
        status_code, detail, provider_code, code_on_exception
    )

    with pytest.raises(LLMExecutionError) as exc_info:
        orchestrator.run_agent("VocabularyAgent", {"text": "safe fixture"})

    assert exc_info.value.code == expected_code
    assert detail not in str(exc_info.value)
