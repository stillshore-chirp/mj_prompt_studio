from __future__ import annotations

from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = REPO_ROOT / ".github/workflows/ci.yml"
def _workflow() -> dict[str, object]:
    loaded = yaml.safe_load(WORKFLOW.read_text(encoding="utf-8"))
    assert isinstance(loaded, dict)
    return loaded


def test_ci_is_the_only_normal_pull_request_workflow() -> None:
    assert WORKFLOW.is_file()
    assert not (REPO_ROOT / ".github/workflows/agent-harness.yml").exists()
    text = WORKFLOW.read_text(encoding="utf-8")
    assert "pull_request:" in text
    assert "branches: [main]" in text


def test_required_jobs_and_quality_gate_contract() -> None:
    workflow = _workflow()
    jobs = workflow["jobs"]
    assert isinstance(jobs, dict)
    expected = {
        "verification_scope",
        "backend",
        "frontend",
        "e2e",
        "package",
        "public_text",
        "governance",
        "workflow_contract",
        "platform_smoke",
        "quality_gate",
    }
    assert expected <= set(jobs)
    quality_gate = jobs["quality_gate"]
    assert isinstance(quality_gate, dict)
    assert quality_gate["if"] == "${{ always() }}"
    assert set(quality_gate["needs"]) >= expected - {"quality_gate"}


def test_classifier_outputs_and_mock_policy_are_wired() -> None:
    text = WORKFLOW.read_text(encoding="utf-8")
    for field in (
        "backend",
        "frontend",
        "e2e",
        "governance",
        "workflow_contract",
        "package",
        "public_text",
        "classification_ok",
    ):
        assert f"{field}: ${{{{ steps.scope.outputs.{field} }}}}" in text
    assert "MJPS_LLM_MODE: mock" in text
    assert '--base "${PR_BASE_SHA}" --head "${PR_HEAD_SHA}"' in text


def test_backend_gate_keeps_static_quality_checks() -> None:
    text = WORKFLOW.read_text(encoding="utf-8")
    assert "run: make lint" in text
    assert "run: make typecheck" in text


def test_governance_and_workflow_contract_jobs_run_focused_contracts() -> None:
    text = WORKFLOW.read_text(encoding="utf-8")
    assert "python scripts/validate_governance.py" in text
    assert "tests/test_validate_governance.py" in text
    assert "tests/test_governance_task_state.py" in text
    expected_command = (
        "python -m pytest -q tests/test_validate_governance.py "
        "tests/test_governance_task_state.py tests/test_ci_workflow.py "
        "tests/test_verification_inputs.py"
    )
    assert expected_command in text
    assert "yaml.safe_load" in text


def test_package_gate_rejects_stale_generated_openapi() -> None:
    text = WORKFLOW.read_text(encoding="utf-8")

    assert "make generate-openapi" in text
    assert "git diff --exit-code -- client/src/shared/types/openapi.json" in text


def test_platform_smoke_is_main_push_only() -> None:
    workflow = _workflow()
    platform_smoke = workflow["jobs"]["platform_smoke"]
    assert isinstance(platform_smoke, dict)
    condition = str(platform_smoke["if"])
    assert "github.event_name == 'push'" in condition
    assert "refs/heads/main" in condition
    assert "matrix" in str(platform_smoke["strategy"])
