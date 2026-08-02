from __future__ import annotations

import logging
from dataclasses import asdict, dataclass
from pathlib import Path
from time import perf_counter
from typing import Any, Literal

from mj_prompt_studio.config import LLM_EXECUTION_POLICY, RuntimeSettings
from mj_prompt_studio.llm.failure import (
    LLMFailureCode,
    failure_code_for_exception,
    failure_message,
)
from mj_prompt_studio.llm.mock_client import MockLLMClient
from mj_prompt_studio.llm.openai_client import (
    OpenAIResponsesClient,
    TokenUsage,
    image_input_item,
)
from mj_prompt_studio.llm.response_schemas import schema_for_agent, validate_schema_payload

logger = logging.getLogger(__name__)

ExecutionBackend = Literal["openai", "mock", "unavailable"]
ResponseIDKind = Literal["openai", "mock"]


class LLMExecutionError(RuntimeError):
    def __init__(self, code: LLMFailureCode) -> None:
        self.code = code
        super().__init__(failure_message(code))


@dataclass(frozen=True)
class ConnectionTestResult:
    ok: bool
    error_code: LLMFailureCode | Literal["mock_mode"] | None = None


@dataclass(frozen=True)
class AgentMetrics:
    usage: TokenUsage
    request_latency_ms: float
    image_input_count: int
    schema_valid: bool
    response_id_present: bool


@dataclass(frozen=True)
class AgentResult:
    agent_name: str
    output_json: dict[str, Any]
    response_id: str | None
    model: str
    reasoning_effort: str
    text_verbosity: str
    execution_backend: ExecutionBackend
    metrics: AgentMetrics


class LLMOrchestrator:
    def __init__(self, settings: RuntimeSettings, api_key: str | None = None) -> None:
        self.settings = settings
        self.api_key = api_key
        self.mock_client = MockLLMClient()
        self.real_client: OpenAIResponsesClient | None = None
        self._initialization_error_code: LLMFailureCode | None = None
        if settings.llm_mode == "real" and api_key:
            try:
                self.real_client = OpenAIResponsesClient(api_key)
            except Exception:  # pragma: no cover - dependency and platform boundary
                self._initialization_error_code = "client_initialization_failed"
                logger.warning("llm_client_initialization_failed")

    @property
    def execution_backend(self) -> ExecutionBackend:
        if self.settings.llm_mode == "mock":
            return "mock"
        if self.real_client is not None:
            return "openai"
        return "unavailable"

    @property
    def execution_error_code(self) -> LLMFailureCode | None:
        if self.execution_backend != "unavailable":
            return None
        if not self.api_key:
            return "api_key_missing"
        return self._initialization_error_code or "client_initialization_failed"

    def execution_metadata(self) -> dict[str, str | bool | None]:
        return {
            "configured_mode": self.settings.llm_mode,
            "execution_backend": self.execution_backend,
            "api_key_configured": self.api_key is not None,
        }

    def require_execution(self) -> None:
        if self.execution_backend == "unavailable":
            raise LLMExecutionError(self.execution_error_code or "client_initialization_failed")

    def run_agent(
        self,
        agent_name: str,
        payload: dict[str, Any],
        *,
        previous_response_id: str | None = None,
        image_paths: list[Path] | None = None,
    ) -> AgentResult:
        images = image_paths or []
        effective_payload = self._payload_with_preferences(agent_name, payload)
        backend = self.execution_backend
        self.require_execution()
        if backend == "mock":
            started_at = perf_counter()
            mock_response = self.mock_client.create_agent_response(agent_name, effective_payload)
            output = mock_response.output_json
            response_id: str | None = mock_response.response_id
            usage = TokenUsage()
            request_latency_ms = (perf_counter() - started_at) * 1000
        else:
            client = self.real_client
            if client is None:
                raise LLMExecutionError("client_initialization_failed")
            try:
                openai_response = client.create_response(
                    input_payload=self._build_input(agent_name, effective_payload, images),
                    text_format=schema_for_agent(agent_name),
                    previous_response_id=(
                        None if self.settings.privacy_mode else previous_response_id
                    ),
                    store=not self.settings.privacy_mode,
                )
            except Exception as exc:
                failure_code = failure_code_for_exception(exc)
                logger.warning("llm_request_failed", extra={"failure_code": failure_code})
                raise LLMExecutionError(failure_code) from exc
            output = openai_response.output_json
            response_id = openai_response.response_id
            usage = openai_response.usage
            request_latency_ms = openai_response.request_latency_ms
        try:
            validate_schema_payload(agent_name, output)
        except Exception as exc:
            self._log_metrics(
                agent_name,
                usage,
                request_latency_ms,
                len(images),
                schema_valid=False,
                response_id_present=response_id is not None,
            )
            logger.warning(
                "llm_output_validation_failed", extra={"failure_code": "structured_output_invalid"}
            )
            raise LLMExecutionError("structured_output_invalid") from exc
        metrics = AgentMetrics(
            usage=usage,
            request_latency_ms=request_latency_ms,
            image_input_count=len(images),
            schema_valid=True,
            response_id_present=response_id is not None,
        )
        self._log_metrics(
            agent_name,
            usage,
            request_latency_ms,
            len(images),
            schema_valid=True,
            response_id_present=response_id is not None,
        )
        return AgentResult(
            agent_name=agent_name,
            output_json=output,
            response_id=response_id,
            model=LLM_EXECUTION_POLICY.model,
            reasoning_effort=LLM_EXECUTION_POLICY.reasoning_effort,
            text_verbosity=LLM_EXECUTION_POLICY.text_verbosity,
            execution_backend=backend,
            metrics=metrics,
        )

    def connection_test(self) -> ConnectionTestResult:
        if self.execution_backend == "mock":
            return ConnectionTestResult(False, "mock_mode")
        if self.execution_backend == "unavailable":
            return ConnectionTestResult(False, self.execution_error_code)
        client = self.real_client
        if client is None:
            return ConnectionTestResult(False, "client_initialization_failed")
        try:
            return ConnectionTestResult(client.connection_test())
        except Exception as exc:
            return ConnectionTestResult(False, failure_code_for_exception(exc))

    def _payload_with_preferences(self, agent_name: str, payload: dict[str, Any]) -> dict[str, Any]:
        preferences = self.settings.feature_preferences_for(agent_name)
        return {
            **payload,
            "llm_preferences": {
                "vocabulary_amount": preferences.vocabulary_amount,
            },
        }

    def _build_input(
        self, agent_name: str, payload: dict[str, Any], image_paths: list[Path]
    ) -> list[dict[str, Any]]:
        content: list[dict[str, Any]] = [
            {
                "type": "input_text",
                "text": (
                    f"You are {agent_name} for MJ Prompt Studio. "
                    f"{_agent_instruction(agent_name)} Return only schema-valid JSON."
                ),
            },
            {"type": "input_text", "text": _redacted_payload(payload)},
        ]
        content.extend(image_input_item(path) for path in image_paths)
        return [{"role": "user", "content": content}]

    def _log_metrics(
        self,
        agent_name: str,
        usage: TokenUsage,
        request_latency_ms: float,
        image_input_count: int,
        *,
        schema_valid: bool,
        response_id_present: bool,
    ) -> None:
        logger.info(
            "llm_request_completed",
            extra={
                "event": "llm_request_completed",
                "agent_name": agent_name,
                "model": LLM_EXECUTION_POLICY.model,
                "reasoning_effort": LLM_EXECUTION_POLICY.reasoning_effort,
                "text_verbosity": LLM_EXECUTION_POLICY.text_verbosity,
                "execution_backend": self.execution_backend,
                **asdict(usage),
                "request_latency_ms": round(request_latency_ms, 3),
                "image_input_count": image_input_count,
                "schema_valid": schema_valid,
                "response_id_present": response_id_present,
            },
        )


def _redacted_payload(payload: dict[str, Any]) -> str:
    safe_payload = {
        key: ("<redacted>" if "key" in key.lower() or "token" in key.lower() else value)
        for key, value in payload.items()
    }
    return str(safe_payload)


def _agent_instruction(agent_name: str) -> str:
    instructions = {
        "PromptGeneratorAgent": (
            "Generate the requested number of distinct image prompt bodies. "
            "Do not add bullets, explanations, JSON, Markdown, or --options."
        ),
        "PromptTransformAgent": (
            "Return one image prompt body for the requested mode. "
            "Keep worldbuilding to one coherent scene and chaos_mix to "
            "one simultaneous, intentional collision of the supplied elements. "
            "Do not add video language, explanations, JSON, Markdown, or --options."
        ),
        "PromptLengthAdjustAgent": (
            "Change only length while retaining the subject, language, style, "
            "and supplied anchors. "
            "Do not add new major subjects, explanations, JSON, Markdown, or --options."
        ),
        "PromptArrangeAgent": (
            "Blend the supplied preset guidance at the requested strength while "
            "retaining the source "
            "subject and anchors. Do not add explanations, JSON, Markdown, or --options."
        ),
    }
    return instructions.get(agent_name, "")
