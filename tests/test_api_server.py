from __future__ import annotations

import time
from pathlib import Path
from typing import Any

from fastapi.testclient import TestClient
from PIL import Image

from mj_prompt_studio.config import RuntimeSettings
from mj_prompt_studio.infra.secret_store import APIKeyResolution, SecretStore
from mj_prompt_studio.server.app_state import create_state
from mj_prompt_studio.server.main import LOCAL_API_REQUEST_HEADER, create_app

LOCAL_API_HEADERS = {LOCAL_API_REQUEST_HEADER: "1"}


def _client(tmp_path: Path, llm_mode: str = "mock") -> TestClient:
    state = create_state(
        RuntimeSettings(
            data_dir=tmp_path,
            llm_mode=llm_mode,
            response_storage="normal",
        )
    )
    return TestClient(create_app(state))


def _wait_for_job(client: TestClient, job_id: str) -> dict[str, Any]:
    for _attempt in range(40):
        response = client.get(f"/api/jobs/{job_id}")
        assert response.status_code == 200
        job = response.json()["job"]
        if job["status"] in {"succeeded", "failed", "cancelled"}:
            return dict(job)
        time.sleep(0.05)
    raise AssertionError(f"job did not finish: {job_id}")


def test_workspace_compile_and_agent_job_use_real_services(tmp_path: Path) -> None:
    with _client(tmp_path) as client:
        workspace = client.get("/api/workspace").json()
        document = workspace["document"]

        response = client.post(
            f"/api/prompt-documents/{document['id']}/compile",
            json={
                "user_brief": "朝食広告",
                "blocks": {
                    **document["blocks"],
                    "subject": "croissant and coffee",
                    "lighting": "soft morning window light",
                },
                "parameters": {**document["parameters"], "aspect_ratio": "4:5"},
                "notes": "",
                "tags": [],
            },
        )
        assert response.status_code == 200
        compiled = response.json()["document"]["compiled_prompt"]
        assert "croissant and coffee" in compiled

        job_response = client.post(
            "/api/agents/intent-intake",
            json={"document_id": document["id"], "brief": "高級ホテルの朝食広告"},
        )
        assert job_response.status_code == 200
        job = _wait_for_job(client, job_response.json()["job"]["id"])
        assert job["status"] == "succeeded"
        assert job["model"] == "gpt-5.6-luna"
        assert job["reasoning_effort"] == "high"
        assert job["text_verbosity"] == "low"
        assert job["execution_backend"] == "mock"
        assert job["response_id_kind"] == "mock"
        assert "document" in job["output_json"]


def test_reference_upload_serves_asset_without_local_path(tmp_path: Path) -> None:
    image_path = tmp_path / "reference.png"
    Image.new("RGB", (12, 8), "#F2E7D8").save(image_path)

    with _client(tmp_path / "data") as client:
        workspace = client.get("/api/workspace").json()
        project_id = workspace["project"]["id"]
        with image_path.open("rb") as file:
            response = client.post(
                f"/api/projects/{project_id}/references/upload",
                files={"file": ("reference.png", file, "image/png")},
            )
        assert response.status_code == 200
        reference = response.json()["reference"]
        assert "local_path" not in reference
        assert reference["image_metadata"]["width"] == 12

        asset = client.get(reference["asset_url"])
        assert asset.status_code == 200
        assert asset.content


def test_settings_response_storage_persists_across_contexts(tmp_path: Path) -> None:
    with _client(tmp_path) as client:
        response = client.put(
            "/api/settings/response-storage", json={"response_storage": "privacy"}
        )
        assert response.status_code == 200
        assert response.json()["settings"]["privacy_mode"] is True

    with _client(tmp_path) as client:
        settings = client.get("/api/settings").json()["settings"]
        assert settings["response_storage"] == "privacy"
        assert settings["privacy_mode"] is True


def test_prompt_workshop_endpoints_use_safe_job_snapshots_and_public_presets(
    tmp_path: Path,
) -> None:
    with _client(tmp_path) as client:
        saved = client.put(
            "/api/settings/exclusion-terms",
            json={"terms": ["  confidential term  ", "CONFIDENTIAL TERM"]},
        )
        assert saved.status_code == 200
        assert saved.json()["settings"]["prompt_exclusion_terms"] == ["confidential term"]

        presets = client.get("/api/prompt-arrange-presets")
        assert presets.status_code == 200
        assert presets.json()["presets"][0]["id"] == "auto"
        assert all("guidance" not in item for item in presets.json()["presets"])

        response = client.post(
            "/api/agents/prompt-transform",
            json={
                "mode": "worldbuilding",
                "source_prompt": "paper sculpture in soft light",
                "output_language": "en",
                "max_characters": None,
                "additional_guidance": "",
            },
        )
        assert response.status_code == 200
        created_job = response.json()["job"]
        assert created_job["input_snapshot"]["source_character_count"] == len(
            "paper sculpture in soft light"
        )
        assert "paper sculpture" not in str(created_job["input_snapshot"])
        assert "confidential term" not in response.text

        job = _wait_for_job(client, created_job["id"])
        assert job["status"] == "succeeded"
        assert job["output_json"]["operation"] == "worldbuilding"
        assert "confidential term" not in str(job["output_json"])


def test_prompt_workshop_api_validates_length_options(tmp_path: Path) -> None:
    with _client(tmp_path) as client:
        invalid = client.post(
            "/api/agents/prompt-length-adjust",
            json={
                "source_prompt": "paper sculpture",
                "length_ratio": 1.5,
                "max_characters": 120,
            },
        )
        assert invalid.status_code == 422

        generated = client.post(
            "/api/agents/prompt-generator",
            json={
                "count": 2,
                "chaos_level": 2,
                "output_language": "ja",
                "guidance": "",
                "deduplicate": False,
            },
        )
        assert generated.status_code == 200
        job = _wait_for_job(client, generated.json()["job"]["id"])
        assert job["status"] == "succeeded"
        assert job["output_json"]["generated_count"] == 2


def test_load_persisted_api_key_applies_without_returning_secret(
    tmp_path: Path, monkeypatch
) -> None:
    monkeypatch.setattr(
        SecretStore,
        "resolve_openai_api_key_from_keyring",
        lambda self: APIKeyResolution("stored-key", "credential_store", "available"),
    )

    with _client(tmp_path, llm_mode="real") as client:
        response = client.post(
            "/api/settings/load-persisted-api-key", headers=LOCAL_API_HEADERS
        )

        assert response.status_code == 200
        assert response.json()["loaded"] is True
        assert response.json()["settings"]["llm_mode"] == "real"
        assert response.json()["settings"]["execution_backend"] == "openai"
        assert response.json()["settings"]["api_key_configured"] is True
        assert "stored-key" not in response.text
        assert "api_key" not in response.json()["settings"]


def test_load_persisted_api_key_keeps_session_unchanged_when_missing(
    tmp_path: Path, monkeypatch
) -> None:
    monkeypatch.setattr(
        SecretStore,
        "resolve_openai_api_key_from_keyring",
        lambda self: APIKeyResolution(None, "not_configured", "not_configured"),
    )

    with _client(tmp_path, llm_mode="real") as client:
        response = client.post(
            "/api/settings/load-persisted-api-key", headers=LOCAL_API_HEADERS
        )

        assert response.status_code == 200
        assert response.json()["loaded"] is False
        assert response.json()["settings"]["llm_mode"] == "real"
        assert response.json()["settings"]["execution_backend"] == "unavailable"
        assert response.json()["settings"]["api_key_configured"] is False


def test_load_persisted_api_key_rejects_a_form_like_request_without_local_header(
    tmp_path: Path, monkeypatch
) -> None:
    monkeypatch.setattr(
        SecretStore,
        "resolve_openai_api_key_from_keyring",
        lambda self: APIKeyResolution("stored-key", "credential_store", "available"),
    )

    with _client(tmp_path) as client:
        response = client.post("/api/settings/load-persisted-api-key")

        assert response.status_code == 403
        assert client.get("/api/settings").json()["settings"]["llm_mode"] == "mock"


def test_connection_test_requires_local_request_header(tmp_path: Path) -> None:
    with _client(tmp_path) as client:
        assert client.post("/api/settings/connection-test").status_code == 403
        response = client.post("/api/settings/connection-test", headers=LOCAL_API_HEADERS)
        assert response.status_code == 200
        assert response.json() == {"ok": False, "error_code": "mock_mode"}


def test_normal_mode_without_a_key_rejects_ai_jobs_and_reports_safe_backend_state(
    tmp_path: Path, monkeypatch
) -> None:
    monkeypatch.setattr(
        SecretStore,
        "resolve_openai_api_key",
        lambda self: APIKeyResolution(None, "not_configured", "not_configured"),
    )

    with _client(tmp_path, llm_mode="real") as client:
        workspace = client.get("/api/workspace").json()
        health = client.get("/api/health").json()
        settings = client.get("/api/settings").json()["settings"]
        response = client.post(
            "/api/agents/intent-intake",
            json={"document_id": workspace["document"]["id"], "brief": "safe fixture"},
        )

        assert health["execution_backend"] == "unavailable"
        assert "db_path" not in health
        assert settings["configured_mode"] == "real"
        assert settings["execution_backend"] == "unavailable"
        assert settings["api_key_configured"] is False
        assert response.status_code == 409
        assert response.json()["detail"]["code"] == "api_key_missing"
        assert "safe fixture" not in response.text
        assert client.get("/api/jobs").json()["jobs"] == []


def test_public_job_and_document_hide_raw_response_ids(tmp_path: Path) -> None:
    with _client(tmp_path) as client:
        workspace = client.get("/api/workspace").json()
        created = client.post(
            "/api/agents/intent-intake",
            json={"document_id": workspace["document"]["id"], "brief": "generic fixture"},
        ).json()["job"]
        job = _wait_for_job(client, created["id"])
        refreshed_workspace = client.get("/api/workspace").json()

        assert job["response_id_kind"] == "mock"
        assert "mock_" not in str(job)
        assert refreshed_workspace["document"]["llm_context"]["latest_response_id"] is None
        assert refreshed_workspace["document"]["llm_context"]["response_id_kind"] == "mock"


def test_cors_preflight_allows_the_local_request_header(tmp_path: Path) -> None:
    with _client(tmp_path) as client:
        response = client.options(
            "/api/settings/load-persisted-api-key",
            headers={
                "Origin": "http://127.0.0.1:5173",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": LOCAL_API_REQUEST_HEADER,
            },
    )

    assert response.status_code == 200
    allowed_headers = response.headers["access-control-allow-headers"].lower()
    assert LOCAL_API_REQUEST_HEADER.lower() in allowed_headers


def test_openapi_schema_contains_react_contract_endpoints(tmp_path: Path) -> None:
    with _client(tmp_path) as client:
        schema = client.get("/openapi.json").json()

    paths = schema["paths"]
    assert "/api/workspace" in paths
    assert "/api/prompt-documents/{document_id}/compile" in paths
    assert "/api/projects/{project_id}/references/upload" in paths
    assert "/api/jobs/{job_id}" in paths
    assert "/api/settings/feature-preferences" in paths
    assert "/api/settings/text-output-options" in paths
    assert "/api/settings/exclusion-terms" in paths
    assert "/api/agents/prompt-generator" in paths
    assert "/api/agents/prompt-transform" in paths
    assert "/api/agents/prompt-length-adjust" in paths
    assert "/api/agents/prompt-arrange" in paths
    assert "/api/prompt-arrange-presets" in paths
    assert "/api/settings/load-persisted-api-key" in paths
    assert "/api/settings/llm-profiles" not in paths


def test_settings_expose_fixed_execution_policy_and_vocabulary_only(tmp_path: Path) -> None:
    with _client(tmp_path) as client:
        settings = client.get("/api/settings").json()["settings"]

    assert settings["effective_model"] == "gpt-5.6-luna"
    assert settings["effective_reasoning_effort"] == "high"
    assert settings["effective_text_verbosity"] == "low"
    assert "available_models" not in settings
    assert "reasoning_efforts" not in settings
    assert set(settings["feature_preferences"]["VocabularyAgent"]) == {
        "vocabulary_amount"
    }


def test_feature_preferences_api_rejects_legacy_model_fields(tmp_path: Path) -> None:
    with _client(tmp_path) as client:
        valid = client.put(
            "/api/settings/feature-preferences",
            json={
                "preferences": {
                    "VocabularyAgent": {"vocabulary_amount": "rich"}
                }
            },
        )
        legacy = client.put(
            "/api/settings/feature-preferences",
            json={
                "preferences": {
                    "VocabularyAgent": {
                        "model": "gpt-5.4-mini",
                        "reasoning_effort": "medium",
                        "vocabulary_amount": "rich",
                    }
                }
            },
        )

    assert valid.status_code == 200
    assert (
        valid.json()["settings"]["feature_preferences"]["VocabularyAgent"]
        == {"vocabulary_amount": "rich"}
    )
    assert legacy.status_code == 422
