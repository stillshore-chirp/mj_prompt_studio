from __future__ import annotations

from types import SimpleNamespace
from typing import Any

from mj_prompt_studio.llm.openai_client import OpenAIResponsesClient


class _FakeResponse:
    output_text = '{"ok": true}'
    id = "resp_test"
    usage = SimpleNamespace(
        input_tokens=120,
        output_tokens=40,
        input_tokens_details=SimpleNamespace(cached_tokens=20),
        output_tokens_details=SimpleNamespace(reasoning_tokens=15),
    )


class _FakeResponses:
    def __init__(self) -> None:
        self.kwargs: dict[str, Any] | None = None

    def create(self, **kwargs: Any) -> _FakeResponse:
        self.kwargs = kwargs
        return _FakeResponse()


class _FakeClient:
    def __init__(self) -> None:
        self.responses = _FakeResponses()


def _client() -> tuple[OpenAIResponsesClient, _FakeClient]:
    fake_client = _FakeClient()
    client = OpenAIResponsesClient.__new__(OpenAIResponsesClient)
    client._client = fake_client
    return client, fake_client


def test_openai_client_builds_exact_fixed_execution_payload() -> None:
    client, fake_client = _client()
    text_format = {"type": "json_schema", "name": "test", "schema": {}}
    input_payload = [{"role": "user", "content": "Return JSON"}]

    response = client.create_response(
        input_payload=input_payload,
        text_format=text_format,
        previous_response_id="resp_previous",
        store=True,
    )

    assert response.output_json == {"ok": True}
    assert fake_client.responses.kwargs == {
        "model": "gpt-5.6-luna",
        "input": input_payload,
        "reasoning": {"effort": "high"},
        "text": {"verbosity": "low", "format": text_format},
        "store": True,
        "previous_response_id": "resp_previous",
    }
    assert "temperature" not in fake_client.responses.kwargs
    assert "mode" not in fake_client.responses.kwargs["reasoning"]
    assert response.usage.input_tokens == 120
    assert response.usage.cached_input_tokens == 20
    assert response.usage.output_tokens == 40
    assert response.usage.reasoning_tokens == 15
    assert response.request_latency_ms >= 0


def test_connection_test_uses_fixed_policy_without_storage_or_continuation() -> None:
    client, fake_client = _client()

    assert client.connection_test() is True
    assert fake_client.responses.kwargs is not None
    assert fake_client.responses.kwargs["model"] == "gpt-5.6-luna"
    assert fake_client.responses.kwargs["reasoning"] == {"effort": "high"}
    assert fake_client.responses.kwargs["text"]["verbosity"] == "low"
    assert fake_client.responses.kwargs["store"] is False
    assert "previous_response_id" not in fake_client.responses.kwargs
