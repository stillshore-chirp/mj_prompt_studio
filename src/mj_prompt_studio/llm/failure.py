from __future__ import annotations

from typing import Any, Literal, cast

LLMFailureCode = Literal[
    "api_key_missing",
    "client_initialization_failed",
    "api_authentication_failed",
    "api_permission_denied",
    "rate_limited",
    "network_unavailable",
    "api_unavailable",
    "api_request_invalid",
    "response_storage_rejected",
    "structured_output_schema_invalid",
    "structured_output_invalid",
    "unexpected",
]

_FAILURE_CODES: frozenset[str] = frozenset(
    {
        "api_key_missing",
        "client_initialization_failed",
        "api_authentication_failed",
        "api_permission_denied",
        "rate_limited",
        "network_unavailable",
        "api_unavailable",
        "api_request_invalid",
        "response_storage_rejected",
        "structured_output_schema_invalid",
        "structured_output_invalid",
        "unexpected",
    }
)

_FAILURE_MESSAGES: dict[LLMFailureCode, str] = {
    "api_key_missing": "AIを実行するにはAPI keyの設定が必要です。",
    "client_initialization_failed": "実APIの準備を完了できませんでした。",
    "api_authentication_failed": "実APIの認証を確認できませんでした。",
    "api_permission_denied": "このAPI keyには必要な実APIの利用権限がありません。",
    "rate_limited": "実APIの利用上限または一時的な混雑のため処理できませんでした。",
    "network_unavailable": "実APIへ接続できませんでした。",
    "api_unavailable": "実API側の一時的な問題で処理できませんでした。",
    "api_request_invalid": "実APIがこの処理のリクエストを受け付けませんでした。",
    "response_storage_rejected": "現在の応答保存設定では実APIがこの処理を受け付けませんでした。",
    "structured_output_schema_invalid": "この操作に必要な構造化形式を実APIが受け付けませんでした。",
    "structured_output_invalid": "実APIの応答をこの操作に必要な形式として確認できませんでした。",
    "unexpected": "AI処理を完了できませんでした。",
}


def failure_message(code: LLMFailureCode) -> str:
    return _FAILURE_MESSAGES[code]


def failure_code_for_exception(exc: Exception) -> LLMFailureCode:
    explicit_code = getattr(exc, "code", None)
    if isinstance(explicit_code, str) and explicit_code in _FAILURE_CODES:
        return cast(LLMFailureCode, explicit_code)

    exception_name = type(exc).__name__.lower()
    if "structuredoutputschema" in exception_name:
        return "structured_output_schema_invalid"
    if "structuredoutput" in exception_name or "jsondecode" in exception_name:
        return "structured_output_invalid"
    if "authentication" in exception_name:
        return "api_authentication_failed"
    if "permission" in exception_name:
        return "api_permission_denied"
    if "ratelimit" in exception_name or "rate_limit" in exception_name:
        return "rate_limited"
    if "timeout" in exception_name or "connection" in exception_name or "network" in exception_name:
        return "network_unavailable"

    status_code = getattr(exc, "status_code", None)
    if status_code == 401:
        return "api_authentication_failed"
    if status_code == 403:
        return "api_permission_denied"
    if status_code == 429:
        return "rate_limited"
    if isinstance(status_code, int) and status_code >= 500:
        return "api_unavailable"
    if status_code in {400, 409, 422}:
        detail = _provider_error_detail(exc)
        if any(token in detail for token in ("schema", "json_schema", "response_format")):
            return "structured_output_schema_invalid"
        if "store" in detail or "retention" in detail:
            return "response_storage_rejected"
        return "api_request_invalid"
    return "unexpected"


def _provider_error_detail(exc: Exception) -> str:
    body = getattr(exc, "body", None)
    if not isinstance(body, dict):
        return ""
    error = body.get("error")
    if not isinstance(error, dict):
        error = body
    values: list[str] = []
    for key in ("code", "type", "param", "message"):
        value: Any = error.get(key)
        if isinstance(value, str):
            values.append(value.lower())
    return " ".join(values)
