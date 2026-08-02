from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

from mj_prompt_studio.config import read_openai_api_key_from_environment

SERVICE_NAME = "MJ Prompt Studio"
ACCOUNT_NAME = "openai_api_key"

APIKeySource = Literal["environment", "credential_store", "session", "not_configured"]
CredentialStoreStatus = Literal["available", "not_configured", "unavailable", "not_checked"]


@dataclass(frozen=True)
class APIKeyResolution:
    value: str | None
    source: APIKeySource
    credential_store_status: CredentialStoreStatus


class SecretStore:
    def read_openai_api_key(self) -> str | None:
        return self.resolve_openai_api_key().value

    def resolve_openai_api_key(self) -> APIKeyResolution:
        value = read_openai_api_key_from_environment()
        if value:
            return APIKeyResolution(value, "environment", "not_checked")
        return self.resolve_openai_api_key_from_keyring()

    def resolve_openai_api_key_from_keyring(self) -> APIKeyResolution:
        keyring = _load_keyring()
        if keyring is None:
            return APIKeyResolution(None, "not_configured", "unavailable")
        try:
            stored = keyring.get_password(SERVICE_NAME, ACCOUNT_NAME)
        except Exception:
            return APIKeyResolution(None, "not_configured", "unavailable")
        if stored:
            return APIKeyResolution(str(stored), "credential_store", "available")
        return APIKeyResolution(None, "not_configured", "not_configured")

    def read_openai_api_key_from_keyring(self) -> str | None:
        return self.resolve_openai_api_key_from_keyring().value

    def write_openai_api_key(self, api_key: str) -> bool:
        keyring = _load_keyring()
        if keyring is None:
            return False
        try:
            keyring.set_password(SERVICE_NAME, ACCOUNT_NAME, api_key)
        except Exception:
            return False
        return True


def _load_keyring() -> Any | None:
    try:
        import keyring
    except Exception:
        return None
    return keyring
