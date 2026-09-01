#!/usr/bin/env python3
"""Select the smallest safe verification profile for a repository diff.

The classifier is intentionally repository-specific.  A new E2E spec or
fixture must be registered explicitly, while the Python and React runtime
roots have conservative extension rules for ordinary source files.  Paths
from ``base...head`` are used by CI so deleted files and both sides of a
rename remain part of the verification input closure.
"""

from __future__ import annotations

import argparse
import json
import subprocess
from collections import Counter
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from pathlib import Path, PurePosixPath

BACKEND = "backend"
FRONTEND = "frontend"
E2E = "e2e"
GOVERNANCE = "governance"
WORKFLOW_CONTRACT = "workflow_contract"
PACKAGE = "package"
PUBLIC_TEXT = "public_text"

# Names used by the evidence planner and workflow contract tests.
FOCUSED_CONTRACT = "focused_contract_pytest"
YAML_PARSE = "workflow_yaml_parse"
BASE_HEAD_CLASSIFICATION = "base_head_classification"
WORKFLOW_YAML_EVIDENCE = "workflow_yaml"

# Compatibility aliases make the change-scoped gate names easy to consume by
# callers that also use the WordPack evidence vocabulary.
BACKEND_FULL = BACKEND
AGENT_HARNESS_FULL = GOVERNANCE
AI_GOVERNANCE_FULL = GOVERNANCE

OUTPUT_FIELDS = (
    BACKEND,
    FRONTEND,
    E2E,
    GOVERNANCE,
    WORKFLOW_CONTRACT,
    PACKAGE,
    PUBLIC_TEXT,
    "classification_ok",
)
ALL_GATES = frozenset(OUTPUT_FIELDS[:-1])


@dataclass(frozen=True)
class GateInputs:
    """The declared input closure for one verification gate."""

    paths: tuple[str, ...]
    config: tuple[str, ...]
    artifacts: tuple[str, ...]
    conditions: tuple[str, ...]


GATE_INPUTS = {
    BACKEND: GateInputs(
        ("src/**", "tests/**"),
        ("pyproject.toml", "requirements*.txt"),
        ("coverage summary",),
        ("Python 3.12", "MJPS_LLM_MODE=mock"),
    ),
    FRONTEND: GateInputs(
        ("client/src/**", "client/tests/**", "client/package*.json"),
        ("client/tsconfig*.json", "client/vite.config.ts"),
        ("client/dist/**",),
        ("Node.js 22",),
    ),
    E2E: GateInputs(
        ("client/e2e/**", "client/playwright.config.ts", "client/src/**"),
        ("client/package-lock.json",),
        ("client/playwright-report/**",),
        ("local Python API", "MJPS_LLM_MODE=mock"),
    ),
    GOVERNANCE: GateInputs(
        (
            "AGENTS.md",
            ".agents/**",
            ".claude/**",
            ".cursor/**",
            "docs/**",
            "scripts/validate_governance.py",
        ),
        ("pyproject.toml",),
        ("governance summary",),
        ("Python 3.12", "repository-relative paths"),
    ),
    WORKFLOW_CONTRACT: GateInputs(
        (
            ".github/workflows/**",
            "scripts/classify_verification_inputs.py",
            "tests/test_ci_workflow.py",
        ),
        ("pyproject.toml",),
        ("classifier JSON",),
        ("PR base...head", "latest Actions"),
    ),
    PACKAGE: GateInputs(
        (
            "pyproject.toml",
            "client/package*.json",
            "client/src/shared/types/openapi.json",
            "scripts/generate_openapi.py",
            "src/mj_prompt_studio/server/main.py",
            "src/mj_prompt_studio/server/routes/**",
            "src/mj_prompt_studio/server/schemas.py",
            "src/mj_prompt_studio/server/serialization.py",
            "Makefile",
        ),
        ("pyproject.toml", "client/package-lock.json"),
        ("dist/**", "client/dist/**"),
        ("Python 3.12", "Node.js 22"),
    ),
    PUBLIC_TEXT: GateInputs(
        (
            ".github/ISSUE_TEMPLATE/**",
            ".github/pull_request_template.md",
            "README.md",
            "docs/**",
            "plans/**",
            "client/src/**",
            "src/mj_prompt_studio/resources/**",
            "src/mj_prompt_studio/ui/**",
        ),
        ("scripts/verify_ui_text.py",),
        ("public text scan summary",),
        ("UTF-8 source tree",),
    ),
}


E2E_PATHS = frozenset(
    {
        "client/e2e/action-availability.spec.ts",
        "client/e2e/auto-suggestion.spec.ts",
        "client/e2e/boot-job-feedback.spec.ts",
        "client/e2e/composer-shortcuts.spec.ts",
        "client/e2e/confirm-dialog.spec.ts",
        "client/e2e/contextual-inspector.spec.ts",
        "client/e2e/draft-persistence.spec.ts",
        "client/e2e/help-widget.spec.ts",
        "client/e2e/image-upload-accessibility.spec.ts",
        "client/e2e/jobs-recovery.spec.ts",
        "client/e2e/main-navigation-accessibility.spec.ts",
        "client/e2e/matrix-keyboard-selection.spec.ts",
        "client/e2e/narrow-layout-reflow.spec.ts",
        "client/e2e/parity.spec.ts",
        "client/e2e/prompt-workshop.spec.ts",
        "client/e2e/reference-tag-switch.spec.ts",
        "client/e2e/result-review-association.spec.ts",
        "client/e2e/settings-privacy.spec.ts",
        "client/e2e/text-zoom-reflow.spec.ts",
    }
)
# Public registry aliases keep focused tests and workflow consumers from
# depending on the internal set representation.
REGISTERED_E2E_SPECS = tuple(sorted(E2E_PATHS))
REGISTERED_FULL_E2E_SPECS = REGISTERED_E2E_SPECS

WORKFLOW_CONTRACT_FILES = frozenset(
    {
        ".github/workflows/ci.yml",
        "scripts/classify_verification_inputs.py",
        "tests/test_verification_inputs.py",
        "tests/test_ci_workflow.py",
    }
)

WORKFLOW_IMPLEMENTATION_FILES = frozenset(
    {
        ".github/workflows/ci.yml",
        "scripts/classify_verification_inputs.py",
    }
)

GOVERNANCE_EXACT = frozenset(
    {
        "AGENTS.md",
        "CLAUDE.md",
        "client/AGENTS.md",
        "src/mj_prompt_studio/AGENTS.md",
        "docs/operations/AGENTS.md",
        "docs/agent-harness.md",
        "docs/agent-principles.md",
        "scripts/validate_governance.py",
    }
)

PUBLIC_TEXT_EXACT = frozenset(
    {
        ".env.example",
        "README.md",
        "scripts/verify_ui_text.py",
        "tests/test_ui_text_policy.py",
    }
)

BACKEND_EXACT = frozenset(
    {
        "scripts/__init__.py",
        "scripts/run_app.py",
        "scripts/run_local_app.py",
    }
)

PACKAGE_EXACT = frozenset(
    {
        "Makefile",
        "pyproject.toml",
        "scripts/generate_openapi.py",
        "client/package.json",
        "client/package-lock.json",
    }
)

CLIENT_CONFIG_EXACT = frozenset(
    {
        "client/eslint.config.js",
        "client/index.html",
        "client/playwright.config.ts",
        "client/tsconfig.app.json",
        "client/tsconfig.json",
        "client/tsconfig.node.json",
        "client/vite.config.ts",
        "client/vite-env.d.ts",
    }
)

API_CONTRACT_EXACT = frozenset(
    {
        "src/mj_prompt_studio/server/main.py",
        "src/mj_prompt_studio/server/schemas.py",
        "src/mj_prompt_studio/server/serialization.py",
    }
)

GENERATED_OPENAPI_PATH = "client/src/shared/types/openapi.json"

# These files existed before the classifier was introduced.  They remain
# known when a base...head diff reports their deletion, without widening a
# runtime gate for an arbitrary new script.
LEGACY_GOVERNANCE_PATHS = frozenset(
    {
        ".github/workflows/agent-harness.yml",
        "requirements-agent-harness.txt",
        "scripts/verify-agent-harness.sh",
        "scripts/verify-ai-governance.sh",
        "scripts/validate_agent_frontmatter.py",
    }
)


@dataclass(frozen=True)
class PathClassification:
    path: str
    rule_id: str
    category: str
    risk: str
    gates: frozenset[str]


def _normalize(path: str) -> str:
    return path.removeprefix("./")


def _is_canonical(path: str) -> bool:
    if not path or path.startswith("/") or "\\" in path:
        return False
    parts = path.split("/")
    return all(part not in {"", ".", ".."} for part in parts)


def _classification(
    path: str, rule_id: str, category: str, risk: str, gates: Iterable[str]
) -> PathClassification:
    return PathClassification(path, rule_id, category, risk, frozenset(gates))


def _is_frontend_test(path: str) -> bool:
    pure_path = PurePosixPath(path)
    return "__tests__" in pure_path.parts or any(
        marker in pure_path.name for marker in (".test.", ".spec.")
    )


def classify_path(path: str) -> PathClassification | None:
    """Classify one repository-relative POSIX path, or return ``None``."""

    path = _normalize(path)
    if not _is_canonical(path):
        return None

    if path in LEGACY_GOVERNANCE_PATHS:
        legacy_gates = {GOVERNANCE}
        if path.startswith(".github/workflows/"):
            legacy_gates.add(WORKFLOW_CONTRACT)
        return _classification(
            path,
            "legacy_governance",
            "legacy_migration",
            "governance",
            legacy_gates,
        )

    if path in WORKFLOW_IMPLEMENTATION_FILES or path.startswith(".github/workflows/"):
        return _classification(path, "workflow", "workflow", "workflow", ALL_GATES)
    if path in WORKFLOW_CONTRACT_FILES:
        return _classification(
            path,
            "workflow_contract_test",
            "workflow_contract",
            "workflow_test",
            {WORKFLOW_CONTRACT},
        )

    if path in E2E_PATHS:
        return _classification(path, "e2e_spec", "e2e", "e2e", {E2E})
    if path.startswith("client/e2e/"):
        # A new E2E spec is an intentional registry change, not an untested
        # generic client file.
        return None
    if path == "client/playwright.config.ts":
        return _classification(path, "e2e_config", "e2e", "e2e_harness", {E2E})

    if path == GENERATED_OPENAPI_PATH:
        return _classification(
            path,
            "generated_api_contract",
            "api_contract",
            "public_api",
            {FRONTEND, E2E, PACKAGE},
        )

    if path in PUBLIC_TEXT_EXACT:
        return _classification(
            path, "public_text_policy", "public_text", "public_text", {PUBLIC_TEXT}
        )

    if path.startswith((".agents/", ".claude/", ".cursor/")) or path in GOVERNANCE_EXACT:
        gates = {GOVERNANCE}
        if path.startswith("docs/"):
            gates.add(PUBLIC_TEXT)
        return _classification(
            path, "governance_surface", "governance", "governance", gates
        )
    if path.startswith("docs/ai-governance/") or path.startswith("docs/agent-"):
        return _classification(
            path, "governance_docs", "governance", "governance", {GOVERNANCE, PUBLIC_TEXT}
        )
    if path.startswith("docs/process/") or path == "docs/documentation-structure.md":
        return _classification(
            path,
            "governance_process_docs",
            "governance",
            "governance",
            {GOVERNANCE, PUBLIC_TEXT},
        )
    if path.startswith(".github/ISSUE_TEMPLATE/") or path == ".github/pull_request_template.md":
        return _classification(
            path,
            "governance_public_template",
            "governance",
            "public_policy",
            {GOVERNANCE, PUBLIC_TEXT},
        )
    if path.startswith("tests/test_governance") or path.startswith(
        "tests/test_validate_governance"
    ):
        return _classification(
            path,
            "governance_contract_test",
            "governance",
            "governance",
            {GOVERNANCE},
        )
    if path.startswith("tests/test_agent_harness"):
        return _classification(
            path,
            "governance_contract_test",
            "governance",
            "governance",
            {GOVERNANCE},
        )

    if path.startswith(("docs/", "plans/")):
        return _classification(
            path, "public_docs", "docs", "public_text", {PUBLIC_TEXT}
        )

    if path in PACKAGE_EXACT:
        gates = {PACKAGE}
        if path == "Makefile":
            gates.add(WORKFLOW_CONTRACT)
            gates.add(GOVERNANCE)
        elif path == "pyproject.toml":
            gates.update({BACKEND, GOVERNANCE, WORKFLOW_CONTRACT})
        elif path == "scripts/generate_openapi.py":
            gates.update({BACKEND, FRONTEND, E2E})
        else:
            gates.update({FRONTEND, E2E})
        return _classification(path, "package_input", "package", "package", gates)

    if path == ".gitignore":
        return _classification(
            path,
            "repository_metadata",
            "repository",
            "non_runtime",
            {WORKFLOW_CONTRACT},
        )

    if path.startswith("client/src/"):
        if _is_frontend_test(path):
            return _classification(
                path,
                "frontend_unit_test",
                "frontend_test",
                "frontend_unit",
                {FRONTEND},
            )
        if path.endswith(".d.ts"):
            return _classification(
                path,
                "frontend_type_declaration",
                "frontend_type",
                "frontend_compile",
                {FRONTEND},
            )
        gates = {FRONTEND, PUBLIC_TEXT}
        risk = "frontend_runtime"
        category = "frontend_runtime"
        if path.endswith(".tsx"):
            gates.add(E2E)
            risk = "visual"
            category = "frontend_visual"
        if path.endswith((".css", ".scss", ".sass", ".less")):
            gates.add(E2E)
            risk = "visual"
            category = "frontend_visual"
        return _classification(path, "frontend_runtime_root", category, risk, gates)
    if path.startswith("client/tests/"):
        return _classification(
            path,
            "frontend_unit_test",
            "frontend_test",
            "frontend_unit",
            {FRONTEND},
        )
    if path in CLIENT_CONFIG_EXACT:
        return _classification(
            path,
            "frontend_config",
            "frontend_config",
            "frontend_config",
            {FRONTEND, E2E},
        )
    if path.startswith("client/"):
        return None

    if path in API_CONTRACT_EXACT or path.startswith("src/mj_prompt_studio/server/routes/"):
        return _classification(
            path,
            "api_contract",
            "api_contract",
            "public_api",
            {BACKEND, FRONTEND, E2E, PACKAGE},
        )

    if path.startswith("src/"):
        gates = {BACKEND}
        if path.startswith(("src/mj_prompt_studio/ui/", "src/mj_prompt_studio/resources/")):
            gates.add(PUBLIC_TEXT)
        return _classification(
            path, "backend_runtime_root", "backend_runtime", "backend_runtime", gates
        )
    if path in BACKEND_EXACT:
        return _classification(
            path,
            "backend_support_script",
            "backend_runtime",
            "backend_runtime",
            {BACKEND},
        )

    if path == "tests/test_ui_text_policy.py":
        return _classification(
            path,
            "public_text_test",
            "public_text",
            "public_text",
            {PUBLIC_TEXT},
        )
    if path.startswith("tests/"):
        if path.startswith("tests/fixtures/"):
            return None
        if PurePosixPath(path).name.startswith("test_") and path.endswith(".py"):
            return _classification(
                path, "backend_test", "backend_test", "backend_test", {BACKEND}
            )
        return None

    # These root files are intentionally explicit so a new root-level file
    # cannot silently bypass verification.
    if path in {".env.example", "README.md"}:
        return _classification(
            path, "public_text_policy", "public_text", "public_text", {PUBLIC_TEXT}
        )

    return None


def _classify_path(path: str) -> PathClassification | None:
    """Private compatibility alias used by focused contract tests."""

    return classify_path(path)


def _is_known(path: str) -> bool:
    return classify_path(path) is not None


def _is_backend(path: str) -> bool:
    classification = classify_path(path)
    return bool(classification and BACKEND in classification.gates)


def _is_harness(path: str) -> bool:
    classification = classify_path(path)
    return bool(classification and classification.category in {"governance", "legacy_migration"})


def _is_ai_governance(path: str) -> bool:
    classification = classify_path(path)
    return bool(classification and GOVERNANCE in classification.gates)


def declared_input_mismatches() -> tuple[str, ...]:
    """Return literal input declarations that do not select their owning gate."""

    mismatches: list[str] = []
    for gate_name, closure in GATE_INPUTS.items():
        for path in (*closure.paths, *closure.config):
            if any(marker in path for marker in "*?["):
                continue
            classification = classify_path(path)
            if classification is None or gate_name not in classification.gates:
                mismatches.append(f"{gate_name}:{path}")
    return tuple(mismatches)


@dataclass(frozen=True)
class GatePlan:
    invalidated_gates: tuple[str, ...]
    selected_checks: tuple[str, ...]
    retained_evidence: tuple[str, ...]
    fallback_reason: str | None
    changed_path_count: int
    unknown_path_count: int
    categories: tuple[str, ...] = ()
    risks: tuple[str, ...] = ()
    unknown_paths: tuple[str, ...] = ()
    backend: bool = False
    frontend: bool = False
    e2e: bool = False
    governance: bool = False
    workflow_contract: bool = False
    package: bool = False
    public_text: bool = False
    classification_ok: bool = True
    path_classifications: tuple[PathClassification, ...] = ()

    def as_json(self) -> dict[str, object]:
        category_counts = Counter(item.category for item in self.path_classifications)
        risk_counts = Counter(item.risk for item in self.path_classifications)
        payload: dict[str, object] = {
            "invalidated_gates": list(self.invalidated_gates),
            "selected_checks": list(self.selected_checks),
            "retained_evidence": list(self.retained_evidence),
            "fallback_reason": self.fallback_reason,
            "changed_path_count": self.changed_path_count,
            "unknown_path_count": self.unknown_path_count,
            "unknown_paths": list(self.unknown_paths[:20]),
            "categories": list(self.categories),
            "category_counts": dict(sorted(category_counts.items())),
            "risks": list(self.risks),
            "risk_counts": dict(sorted(risk_counts.items())),
        }
        payload.update({field: bool(getattr(self, field)) for field in OUTPUT_FIELDS})
        return payload


def _full_plan() -> GatePlan:
    mismatches = declared_input_mismatches()
    if mismatches:
        return GatePlan(
            invalidated_gates=(),
            selected_checks=(BASE_HEAD_CLASSIFICATION, FOCUSED_CONTRACT, YAML_PARSE),
            retained_evidence=(),
            fallback_reason="declared gate input mismatch: " + ", ".join(mismatches),
            changed_path_count=0,
            unknown_path_count=0,
            categories=("classifier_contract_failure",),
            risks=("workflow",),
            classification_ok=False,
        )
    return GatePlan(
        invalidated_gates=tuple(sorted(ALL_GATES)),
        selected_checks=tuple(
            sorted(ALL_GATES | {FOCUSED_CONTRACT, YAML_PARSE, BASE_HEAD_CLASSIFICATION})
        ),
        retained_evidence=(),
        fallback_reason=None,
        changed_path_count=0,
        unknown_path_count=0,
        categories=("full_profile",),
        risks=("full",),
        backend=True,
        frontend=True,
        e2e=True,
        governance=True,
        workflow_contract=True,
        package=True,
        public_text=True,
        classification_ok=True,
    )


def classify_paths(
    paths: Iterable[str], *, fallback_reason: str | None = None, profile: str = "pr"
) -> GatePlan:
    """Classify changed paths for a PR profile or the full main profile."""

    if profile == "full":
        return _full_plan()
    if profile != "pr":
        raise ValueError(f"unsupported classifier profile: {profile}")

    mismatches = declared_input_mismatches()
    if mismatches and fallback_reason is None:
        fallback_reason = "declared gate input mismatch: " + ", ".join(mismatches)

    changed = tuple(dict.fromkeys(_normalize(path) for path in paths if path))
    classifications: list[PathClassification] = []
    unknown: list[str] = []
    for path in changed:
        classification = classify_path(path)
        if classification is None:
            unknown.append(path)
            classifications.append(_classification(path, "unknown_path", "unknown", "unknown", ()))
        else:
            classifications.append(classification)

    unknown_tuple = tuple(unknown)
    if unknown_tuple and fallback_reason is None:
        fallback_reason = "unclassified path requires an explicit category rule"
    gates = frozenset(gate for item in classifications for gate in item.gates)
    categories = tuple(sorted({item.category for item in classifications}))
    risks = tuple(sorted({item.risk for item in classifications}))
    classification_ok = not unknown_tuple and fallback_reason is None
    workflow_changed = any(item.category == "workflow" for item in classifications)
    contract_changed = WORKFLOW_CONTRACT in gates

    invalidated = set(gates)
    selected = set(gates)
    if fallback_reason:
        # Keep the always-run classifier/quality gate as the only trustworthy
        # result.  These support checks make the failed-closed reason visible.
        invalidated.clear()
        selected = {FOCUSED_CONTRACT, BASE_HEAD_CLASSIFICATION, YAML_PARSE}
    if workflow_changed or contract_changed:
        selected.update({FOCUSED_CONTRACT, BASE_HEAD_CLASSIFICATION})
        if workflow_changed:
            selected.add(YAML_PARSE)
    retained = () if workflow_changed else (WORKFLOW_YAML_EVIDENCE,)

    return GatePlan(
        invalidated_gates=tuple(sorted(invalidated)),
        selected_checks=tuple(sorted(selected)),
        retained_evidence=retained,
        fallback_reason=fallback_reason,
        changed_path_count=len(changed),
        unknown_path_count=len(unknown_tuple),
        categories=categories,
        risks=risks,
        unknown_paths=unknown_tuple[:20],
        backend=BACKEND in gates,
        frontend=FRONTEND in gates,
        e2e=E2E in gates,
        governance=GOVERNANCE in gates,
        workflow_contract=WORKFLOW_CONTRACT in gates,
        package=PACKAGE in gates,
        public_text=PUBLIC_TEXT in gates,
        classification_ok=classification_ok,
        path_classifications=tuple(classifications),
    )


def changed_paths(base: str, head: str) -> list[str]:
    """Return changed paths, including deleted names and both rename sides."""

    result = subprocess.run(
        [
            "git",
            "diff",
            "--name-only",
            "--no-renames",
            "-z",
            f"{base}...{head}",
            "--",
        ],
        check=True,
        capture_output=True,
    )
    return [
        value.decode("utf-8", errors="surrogateescape")
        for value in result.stdout.split(b"\0")
        if value
    ]


def _write_github_outputs(output_path: Path, plan: GatePlan) -> None:
    with output_path.open("a", encoding="utf-8") as output:
        for field in OUTPUT_FIELDS:
            output.write(f"{field}={str(bool(getattr(plan, field))).lower()}\n")
        output.write(
            "selected_checks="
            f"{json.dumps(plan.selected_checks, ensure_ascii=False, separators=(',', ':'))}\n"
        )
        output.write(f"changed_path_count={plan.changed_path_count}\n")
        output.write(f"unknown_path_count={plan.unknown_path_count}\n")


def _parse_args(argv: Sequence[str] | None) -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", help="Base commit SHA or ref")
    parser.add_argument("--head", help="Head commit SHA or ref")
    parser.add_argument(
        "--profile", choices=("pr", "full"), default="pr", help="PR diff or full main profile"
    )
    parser.add_argument("--full", action="store_true", help="Alias for --profile full")
    parser.add_argument(
        "--no-renames", action="store_true", help="Keep both names in a rename diff"
    )
    parser.add_argument("--github-output", type=Path, help="Append outputs for GitHub Actions")
    return parser.parse_args(argv)


def main(argv: Sequence[str] | None = None) -> int:
    args = _parse_args(argv)
    profile = "full" if args.full else args.profile
    if profile == "full":
        plan = _full_plan()
    else:
        if not args.base or not args.head:
            raise SystemExit("--base and --head are required for the PR profile")
        try:
            plan = classify_paths(changed_paths(args.base, args.head))
        except subprocess.CalledProcessError as error:
            plan = classify_paths(
                (), fallback_reason=f"git diff failed with status {error.returncode}"
            )

    if args.github_output:
        _write_github_outputs(args.github_output, plan)
    print(json.dumps(plan.as_json(), ensure_ascii=False, sort_keys=True))
    return 0 if plan.classification_ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
