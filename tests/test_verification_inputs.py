from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest
from scripts.classify_verification_inputs import (
    BASE_HEAD_CLASSIFICATION,
    FOCUSED_CONTRACT,
    GATE_INPUTS,
    OUTPUT_FIELDS,
    WORKFLOW_YAML_EVIDENCE,
    YAML_PARSE,
    changed_paths,
    classify_path,
    classify_paths,
    declared_input_mismatches,
    main,
)


def test_docs_only_keeps_product_gates_unselected() -> None:
    plan = classify_paths(["docs/README.md"])

    assert plan.classification_ok is True
    assert plan.categories == ("docs",)
    assert plan.retained_evidence == (WORKFLOW_YAML_EVIDENCE,)
    assert plan.backend is False
    assert plan.frontend is False
    assert plan.e2e is False
    assert plan.package is False


def test_canonical_governance_docs_select_public_text_policy() -> None:
    plan = classify_paths(["docs/agent-harness.md", "docs/agent-principles.md"])

    assert plan.classification_ok is True
    assert plan.governance is True
    assert plan.public_text is True
    assert plan.backend is False
    assert plan.frontend is False
    assert plan.e2e is False


def test_governance_only_does_not_select_product_or_package_gates() -> None:
    plan = classify_paths([".agents/skills/example/SKILL.md", "docs/ai-governance/policy.md"])

    assert plan.classification_ok is True
    assert plan.governance is True
    assert plan.backend is False
    assert plan.frontend is False
    assert plan.e2e is False
    assert plan.package is False
    assert plan.workflow_contract is False
    assert plan.categories == ("governance",)


@pytest.mark.parametrize(
    "path",
    [
        "requirements-agent-harness.txt",
        "scripts/validate_agent_frontmatter.py",
        "scripts/verify-agent-harness.sh",
        "scripts/verify-ai-governance.sh",
        ".github/workflows/agent-harness.yml",
    ],
)
def test_deleted_legacy_governance_paths_are_known_without_product_gates(path: str) -> None:
    plan = classify_paths([path])

    assert plan.classification_ok is True
    assert plan.categories == ("legacy_migration",)
    assert plan.governance is True
    assert plan.backend is False
    assert plan.frontend is False
    assert plan.e2e is False
    assert plan.package is False


def test_backend_and_frontend_paths_select_their_product_gates() -> None:
    backend = classify_paths(["src/mj_prompt_studio/application/services.py"])
    frontend = classify_paths(["client/src/features/composer/ComposerView.tsx"])

    assert backend.classification_ok is True
    assert backend.backend is True
    assert backend.frontend is False
    assert backend.e2e is False
    assert frontend.classification_ok is True
    assert frontend.frontend is True
    assert frontend.e2e is True
    assert frontend.package is False
    assert frontend.public_text is True


def test_registered_e2e_and_unknown_e2e_paths_fail_closed() -> None:
    registered = classify_paths(["client/e2e/parity.spec.ts"])
    unknown = classify_paths(["client/e2e/new-flow.spec.ts"])

    assert registered.classification_ok is True
    assert registered.e2e is True
    assert registered.backend is False
    assert unknown.classification_ok is False
    assert unknown.unknown_paths == ("client/e2e/new-flow.spec.ts",)
    assert unknown.e2e is False
    assert unknown.frontend is False


def test_package_and_public_text_inputs_are_explicit() -> None:
    package = classify_paths(["pyproject.toml"])
    public_text = classify_paths(["scripts/verify_ui_text.py"])

    assert package.classification_ok is True
    assert package.package is True
    assert package.backend is True
    assert package.governance is True
    assert package.workflow_contract is True
    assert public_text.classification_ok is True
    assert public_text.public_text is True
    assert public_text.backend is False


def test_api_contract_selects_generated_client_and_acceptance_gates() -> None:
    plan = classify_paths(["src/mj_prompt_studio/server/schemas.py"])

    assert plan.classification_ok is True
    assert plan.backend is True
    assert plan.frontend is True
    assert plan.e2e is True
    assert plan.package is True


def test_nonvisual_frontend_runtime_does_not_select_e2e() -> None:
    plan = classify_paths(["client/src/shared/utils/prompt.ts"])

    assert plan.classification_ok is True
    assert plan.frontend is True
    assert plan.e2e is False
    assert plan.public_text is True


def test_frontend_type_declaration_selects_compile_gate_only() -> None:
    plan = classify_paths(["client/src/vite-env.d.ts"])

    assert plan.classification_ok is True
    assert plan.frontend is True
    assert plan.e2e is False
    assert plan.public_text is False


def test_workflow_changes_select_all_major_gates_and_contract_checks() -> None:
    plan = classify_paths([".github/workflows/ci.yml"])

    assert plan.classification_ok is True
    assert all(getattr(plan, field) is True for field in OUTPUT_FIELDS[:-1])
    assert {FOCUSED_CONTRACT, BASE_HEAD_CLASSIFICATION, YAML_PARSE} <= set(plan.selected_checks)
    assert plan.retained_evidence == ()


def test_workflow_contract_test_change_does_not_expand_to_product_gates() -> None:
    plan = classify_paths(["tests/test_ci_workflow.py"])

    assert plan.classification_ok is True
    assert plan.workflow_contract is True
    assert plan.backend is False
    assert plan.frontend is False
    assert plan.e2e is False
    assert plan.package is False


def test_unknown_path_is_fail_closed_without_product_gate_success() -> None:
    plan = classify_paths(["new-area/unknown-input.toml"])

    assert plan.classification_ok is False
    assert plan.unknown_path_count == 1
    assert plan.unknown_paths == ("new-area/unknown-input.toml",)
    assert not any(getattr(plan, field) for field in OUTPUT_FIELDS[:-1])
    assert set(plan.selected_checks) == {
        FOCUSED_CONTRACT,
        BASE_HEAD_CLASSIFICATION,
        YAML_PARSE,
    }


def test_noncanonical_paths_are_unknown() -> None:
    for path in ("/tmp/input.py", "../input.py", "src//main.py", "src\\main.py"):
        assert classify_path(path) is None


def test_every_tracked_path_has_a_classification_rule() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    tracked = subprocess.check_output(["git", "ls-files", "-z"], cwd=repo_root).split(b"\0")
    unknown = [
        path.decode("utf-8", errors="surrogateescape")
        for path in tracked
        if path and classify_path(path.decode("utf-8", errors="surrogateescape")) is None
    ]

    assert unknown == []


def test_rename_and_delete_diff_keeps_both_names(monkeypatch: pytest.MonkeyPatch) -> None:
    recorded: list[str] = []

    def fake_run(command: list[str], **_: object) -> object:
        recorded.extend(command)
        return type("Completed", (), {"stdout": b"old/path.py\0new/path.py\0"})()

    monkeypatch.setattr("scripts.classify_verification_inputs.subprocess.run", fake_run)

    assert changed_paths("base", "head") == ["old/path.py", "new/path.py"]
    assert "--no-renames" in recorded
    assert "base...head" in recorded


def test_cli_diff_failure_is_nonzero_and_writes_fail_closed_outputs(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    def fail_diff(_: str, __: str) -> list[str]:
        raise subprocess.CalledProcessError(returncode=128, cmd=["git", "diff"])

    output_path = tmp_path / "github-output"
    monkeypatch.setattr("scripts.classify_verification_inputs.changed_paths", fail_diff)

    assert (
        main(
            [
                "--base",
                "missing",
                "--head",
                "head",
                "--github-output",
                str(output_path),
            ]
        )
        == 1
    )
    payload = json.loads(capsys.readouterr().out)
    assert payload["classification_ok"] is False
    assert payload["fallback_reason"] == "git diff failed with status 128"
    assert "classification_ok=false" in output_path.read_text(encoding="utf-8")


def test_full_profile_is_used_for_main_and_selects_every_gate() -> None:
    plan = classify_paths([], profile="full")

    assert plan.classification_ok is True
    assert all(getattr(plan, field) is True for field in OUTPUT_FIELDS)
    assert plan.categories == ("full_profile",)


def test_cli_head_to_head_succeeds() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    result = subprocess.run(
        [
            sys.executable,
            str(repo_root / "scripts/classify_verification_inputs.py"),
            "--base",
            "HEAD",
            "--head",
            "HEAD",
        ],
        cwd=repo_root,
        capture_output=True,
        text=True,
        check=False,
    )

    assert result.returncode == 0
    assert json.loads(result.stdout)["changed_path_count"] == 0


def test_gate_input_closures_have_config_artifact_and_condition_entries() -> None:
    assert set(GATE_INPUTS) == {
        "backend",
        "frontend",
        "e2e",
        "governance",
        "workflow_contract",
        "package",
        "public_text",
    }
    for closure in GATE_INPUTS.values():
        assert closure.paths
        assert closure.config
        assert closure.artifacts
        assert closure.conditions

    assert declared_input_mismatches() == ()


def test_shared_pyproject_config_invalidates_every_declared_gate() -> None:
    plan = classify_paths(["pyproject.toml"])

    for gate_name, closure in GATE_INPUTS.items():
        if "pyproject.toml" in closure.config:
            assert getattr(plan, gate_name) is True
