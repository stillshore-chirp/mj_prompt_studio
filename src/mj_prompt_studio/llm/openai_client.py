from __future__ import annotations

import base64
import json
import mimetypes
from dataclasses import dataclass
from pathlib import Path
from time import perf_counter
from typing import Any

from mj_prompt_studio.config import LLM_EXECUTION_POLICY


@dataclass(frozen=True)
class TokenUsage:
    input_tokens: int = 0
    cached_input_tokens: int = 0
    output_tokens: int = 0
    reasoning_tokens: int = 0


@dataclass(frozen=True)
class OpenAIResponse:
    output_json: dict[str, Any]
    response_id: str | None
    usage: TokenUsage
    request_latency_ms: float


class OpenAIResponsesClient:
    def __init__(self, api_key: str | None = None) -> None:
        try:
            from openai import OpenAI
        except ModuleNotFoundError as exc:  # pragma: no cover - dependency boundary
            raise RuntimeError("openai package is not installed") from exc
        self._client = OpenAI(api_key=api_key)

    def create_response(
        self,
        *,
        input_payload: list[dict[str, Any]],
        text_format: dict[str, Any],
        previous_response_id: str | None,
        store: bool,
    ) -> OpenAIResponse:
        kwargs: dict[str, Any] = {
            "model": LLM_EXECUTION_POLICY.model,
            "input": input_payload,
            "reasoning": {"effort": LLM_EXECUTION_POLICY.reasoning_effort},
            "text": {
                "verbosity": LLM_EXECUTION_POLICY.text_verbosity,
                "format": text_format,
            },
            "store": store,
        }
        if previous_response_id:
            kwargs["previous_response_id"] = previous_response_id
        started_at = perf_counter()
        response = self._client.responses.create(**kwargs)
        latency_ms = (perf_counter() - started_at) * 1000
        output_text = getattr(response, "output_text", None)
        if not output_text:
            raise ValueError("OpenAI response did not include output_text")
        return OpenAIResponse(
            output_json=json.loads(output_text),
            response_id=getattr(response, "id", None),
            usage=_extract_usage(getattr(response, "usage", None)),
            request_latency_ms=latency_ms,
        )

    def connection_test(self) -> bool:
        test_schema = {
            "type": "json_schema",
            "name": "connection_test",
            "strict": True,
            "schema": {
                "type": "object",
                "required": ["ok"],
                "properties": {"ok": {"type": "boolean"}},
                "additionalProperties": False,
            },
        }
        response = self.create_response(
            input_payload=[{"role": "user", "content": 'Return {"ok": true} as JSON.'}],
            text_format=test_schema,
            previous_response_id=None,
            store=False,
        )
        return bool(response.output_json.get("ok"))


def image_input_item(image_path: Path) -> dict[str, Any]:
    mime_type = mimetypes.guess_type(image_path)[0] or "image/png"
    encoded = base64.b64encode(image_path.read_bytes()).decode("ascii")
    return {
        "type": "input_image",
        "image_url": f"data:{mime_type};base64,{encoded}",
    }


def _extract_usage(usage: Any) -> TokenUsage:
    if usage is None:
        return TokenUsage()
    input_details = getattr(usage, "input_tokens_details", None)
    output_details = getattr(usage, "output_tokens_details", None)
    return TokenUsage(
        input_tokens=int(getattr(usage, "input_tokens", 0) or 0),
        cached_input_tokens=int(getattr(input_details, "cached_tokens", 0) or 0),
        output_tokens=int(getattr(usage, "output_tokens", 0) or 0),
        reasoning_tokens=int(getattr(output_details, "reasoning_tokens", 0) or 0),
    )
