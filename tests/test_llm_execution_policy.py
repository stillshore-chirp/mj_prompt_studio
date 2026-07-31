from pathlib import Path

from mj_prompt_studio.app.app_context import AppContext
from mj_prompt_studio.config import LLM_EXECUTION_POLICY, RuntimeSettings
from mj_prompt_studio.llm.mock_client import MockLLMClient
from mj_prompt_studio.llm.openai_client import OpenAIResponse, TokenUsage
from mj_prompt_studio.llm.orchestrator import LLMOrchestrator


def _settings(tmp_path: Path, response_storage: str = "normal") -> RuntimeSettings:
    return RuntimeSettings(
        data_dir=tmp_path,
        llm_mode="mock",
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


def test_orchestrator_preserves_images_and_normal_continuation(tmp_path: Path) -> None:
    orchestrator = LLMOrchestrator(_settings(tmp_path))
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
    orchestrator = LLMOrchestrator(_settings(tmp_path, response_storage="privacy"))
    client = _CapturingResponsesClient()
    orchestrator.real_client = client

    orchestrator.run_agent(
        "VocabularyAgent",
        {"text": "上質"},
        previous_response_id="resp_luna",
    )

    assert client.calls[0]["previous_response_id"] is None
    assert client.calls[0]["store"] is False
