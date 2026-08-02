from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal, cast

LLMFailureCode = Literal[
    "api_key_missing",
    "client_initialization_failed",
    "api_authentication_failed",
    "api_permission_denied",
    "api_quota_exhausted",
    "rate_limited",
    "network_unavailable",
    "api_unavailable",
    "api_request_invalid",
    "response_storage_rejected",
    "structured_output_schema_invalid",
    "structured_output_invalid",
    "unexpected",
]

LLMFailureStage = Literal[
    "execution_setup",
    "request",
    "response_validation",
    "semantic_validation",
    "unknown",
]

_FAILURE_STAGES: frozenset[str] = frozenset(
    {"execution_setup", "request", "response_validation", "semantic_validation", "unknown"}
)

_SAFE_PROVIDER_ERROR_CODES: frozenset[str] = frozenset(
    {
        "credit_balance_exhausted",
        "insufficient_quota",
        "invalid_api_key",
        "invalid_request_error",
        "invalid_value",
        "model_not_found",
        "organization_spend_limit_exceeded",
        "organization_usage_limit_exceeded",
        "project_spend_limit_exceeded",
        "rate_limit_exceeded",
        "server_error",
        "unsupported_parameter",
    }
)


@dataclass(frozen=True)
class LLMFailureDiagnostics:
    code: LLMFailureCode
    stage: LLMFailureStage
    provider_status_code: int | None
    provider_error_code: str | None

_FAILURE_CODES: frozenset[str] = frozenset(
    {
        "api_key_missing",
        "client_initialization_failed",
        "api_authentication_failed",
        "api_permission_denied",
        "api_quota_exhausted",
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
    "api_quota_exhausted": "実APIの利用枠または請求上限に達したため処理できませんでした。",
    "rate_limited": "実APIの一時的なリクエスト制限のため処理できませんでした。",
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
        return "api_quota_exhausted" if _provider_quota_exhausted(exc) else "rate_limited"
    if "timeout" in exception_name or "connection" in exception_name or "network" in exception_name:
        return "network_unavailable"

    status_code = getattr(exc, "status_code", None)
    if status_code == 401:
        return "api_authentication_failed"
    if status_code == 403:
        return "api_permission_denied"
    if status_code == 429 and _provider_quota_exhausted(exc):
        return "api_quota_exhausted"
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


def failure_diagnostics_for_exception(exc: Exception) -> LLMFailureDiagnostics:
    code = failure_code_for_exception(exc)
    stage = _failure_stage_for_exception(exc, code)
    status_code = _safe_provider_status_code(exc)
    provider_code = _safe_provider_error_code(exc)
    return LLMFailureDiagnostics(code, stage, status_code, provider_code)


def _failure_stage_for_exception(
    exc: Exception, code: LLMFailureCode
) -> LLMFailureStage:
    explicit_stage = getattr(exc, "failure_stage", None)
    if isinstance(explicit_stage, str) and explicit_stage in _FAILURE_STAGES:
        return cast(LLMFailureStage, explicit_stage)
    if code in {"api_key_missing", "client_initialization_failed"}:
        return "execution_setup"
    if _safe_provider_status_code(exc) is not None or code.startswith("api_") or code in {
        "rate_limited",
        "network_unavailable",
        "response_storage_rejected",
        "structured_output_schema_invalid",
    }:
        return "request"
    if code == "structured_output_invalid":
        return "response_validation"
    return "unknown"


def _safe_provider_status_code(exc: Exception) -> int | None:
    status_code = getattr(exc, "provider_status_code", None)
    if status_code is None:
        status_code = getattr(exc, "status_code", None)
    if isinstance(status_code, int) and 400 <= status_code <= 599:
        return status_code
    return None


def _safe_provider_error_code(exc: Exception) -> str | None:
    candidates: list[Any] = [
        getattr(exc, "provider_error_code", None),
        getattr(exc, "code", None),
    ]
    body = getattr(exc, "body", None)
    if isinstance(body, dict):
        error = body.get("error")
        if not isinstance(error, dict):
            error = body
        candidates.append(error.get("code"))
    candidates.append(getattr(exc, "provider_code", None))
    for value in candidates:
        if isinstance(value, str) and value.lower() in _SAFE_PROVIDER_ERROR_CODES:
            return value.lower()
    return None


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


def _provider_quota_exhausted(exc: Exception) -> bool:
    """Classify durable 429 failures from safe provider code/type fields only."""
    identifiers = {
        value.lower()
        for value in (getattr(exc, "code", None), getattr(exc, "type", None))
        if isinstance(value, str)
    }
    body = getattr(exc, "body", None)
    if isinstance(body, dict):
        error = body.get("error")
        if not isinstance(error, dict):
            error = body
        identifiers.update(
            value.lower()
            for key in ("code", "type")
            if isinstance((value := error.get(key)), str)
        )
    return bool(
        identifiers
        & {
            "credit_balance_exhausted",
            "organization_spend_limit_exceeded",
            "project_spend_limit_exceeded",
            "organization_usage_limit_exceeded",
            "insufficient_quota",
        }
    )
