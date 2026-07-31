from __future__ import annotations

import logging
from dataclasses import asdict, dataclass
from pathlib import Path
from time import perf_counter
from typing import Any

from mj_prompt_studio.config import LLM_EXECUTION_POLICY, RuntimeSettings
from mj_prompt_studio.llm.mock_client import MockLLMClient
from mj_prompt_studio.llm.openai_client import (
    OpenAIResponsesClient,
    TokenUsage,
    image_input_item,
)
from mj_prompt_studio.llm.response_schemas import schema_for_agent, validate_schema_payload

logger = logging.getLogger(__name__)


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
    metrics: AgentMetrics


class LLMOrchestrator:
    def __init__(self, settings: RuntimeSettings, api_key: str | None = None) -> None:
        self.settings = settings
        self.api_key = api_key
        self.mock_client = MockLLMClient()
        self.real_client: OpenAIResponsesClient | None = None
        if settings.llm_mode == "real" and api_key:
            self.real_client = OpenAIResponsesClient(api_key)

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
        if self.real_client is None:
            started_at = perf_counter()
            mock_response = self.mock_client.create_agent_response(agent_name, effective_payload)
            output = mock_response.output_json
            response_id: str | None = mock_response.response_id
            usage = TokenUsage()
            request_latency_ms = (perf_counter() - started_at) * 1000
        else:
            openai_response = self.real_client.create_response(
                input_payload=self._build_input(agent_name, effective_payload, images),
                text_format=schema_for_agent(agent_name),
                previous_response_id=(
                    None if self.settings.privacy_mode else previous_response_id
                ),
                store=not self.settings.privacy_mode,
            )
            output = openai_response.output_json
            response_id = openai_response.response_id
            usage = openai_response.usage
            request_latency_ms = openai_response.request_latency_ms
        try:
            validate_schema_payload(agent_name, output)
        except Exception:
            self._log_metrics(
                agent_name,
                usage,
                request_latency_ms,
                len(images),
                schema_valid=False,
                response_id_present=response_id is not None,
            )
            raise
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
            metrics=metrics,
        )

    def connection_test(self) -> bool:
        if self.real_client is None:
            return True
        return self.real_client.connection_test()

    def _payload_with_preferences(
        self, agent_name: str, payload: dict[str, Any]
    ) -> dict[str, Any]:
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
                    "Return only schema-valid JSON."
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
