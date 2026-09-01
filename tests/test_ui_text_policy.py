from pathlib import Path

import pytest
from scripts.verify_ui_text import FORBIDDEN_PATTERNS, is_user_visible_scan_path, verify

from mj_prompt_studio.ui.strings import USER_VISIBLE_STRINGS


def test_ui_text_does_not_expose_midjourney_version_numbers() -> None:
    for text in USER_VISIBLE_STRINGS:
        assert not any(pattern.search(text) for pattern in FORBIDDEN_PATTERNS), text


def test_machine_readable_governance_schema_is_not_user_visible_copy() -> None:
    assert not is_user_visible_scan_path(
        Path("docs/ai-governance/templates/task-state.json")
    )
    assert is_user_visible_scan_path(
        Path("docs/ai-governance/templates/uiux-review-report.md")
    )
    assert is_user_visible_scan_path(Path("docs/user-manual.md"))


def test_pull_request_template_is_scanned_as_public_text(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    template = tmp_path / ".github/pull_request_template.md"
    template.parent.mkdir(parents=True)
    template.write_text("User-visible V6 label", encoding="utf-8")
    monkeypatch.chdir(tmp_path)

    with pytest.raises(SystemExit, match="Forbidden user-visible version text"):
        verify()
