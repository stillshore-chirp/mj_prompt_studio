from __future__ import annotations

from typing import Any

from mj_prompt_studio.llm.openai_client import OpenAIResponsesClient


class _FakeResponse:
    output_text = '{"ok": true}'
    id = "resp_test"


class _FakeResponses:
    def __init__(self) -> None:
        self.kwargs: dict[str, Any] | None = None

    def create(self, **kwargs: Any) -> _FakeResponse:
        self.kwargs = kwargs
        return _FakeResponse()


class _FakeClient:
    def __init__(self) -> None:
        self.responses = _FakeResponses()


def test_openai_client_caps_disallowed_model_and_reasoning_before_request() -> None:
    fake_client = _FakeClient()
    client = OpenAIResponsesClient.__new__(OpenAIResponsesClient)
    client._client = fake_client

    response = client.create_response(
        model="gpt-5.5",
        input_payload=[{"role": "user", "content": "Return JSON"}],
        reasoning_effort="high",
        text_format={"type": "json_schema", "name": "test", "schema": {}},
        previous_response_id=None,
        store=False,
    )

    assert response.output_json == {"ok": True}
    assert fake_client.responses.kwargs is not None
    assert fake_client.responses.kwargs["model"] == "gpt-5.4-mini"
    assert fake_client.responses.kwargs["reasoning"] == {"effort": "medium"}
