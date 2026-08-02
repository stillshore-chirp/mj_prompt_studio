from pathlib import Path

import pytest

from mj_prompt_studio.app.app_context import AppContext
from mj_prompt_studio.config import RuntimeSettings
from mj_prompt_studio.domain.arrange_presets import load_arrange_presets
from mj_prompt_studio.domain.prompt_output import split_known_options
from mj_prompt_studio.domain.prompt_workshop import (
    assess_length,
    normalize_exclusion_terms_for_storage,
    sanitize_generated_prompt,
    validate_exclusion_terms,
)
from mj_prompt_studio.domain.reference import ResultImage
from mj_prompt_studio.infra.ruleset_loader import load_standard_ruleset
from mj_prompt_studio.llm.mock_client import MockLLMResponse


def _context(tmp_path: Path) -> AppContext:
    return AppContext(
        RuntimeSettings(
            data_dir=tmp_path,
            llm_mode="mock",
            response_storage="normal",
        )
    )


def test_text_option_parser_keeps_unknown_options_in_the_body() -> None:
    ruleset = load_standard_ruleset()

    parts = split_known_options(
        "paper sculpture --custom-weight 0.7 --ar 4:5 --s 80", ruleset
    )

    assert parts.body == "paper sculpture --custom-weight 0.7"
    assert parts.parameters.aspect_ratio == "4:5"
    assert parts.parameters.stylize == 80


def test_exclusion_terms_normalize_duplicates_and_reject_invalid_values() -> None:
    assert normalize_exclusion_terms_for_storage(["  \uff21\uff22\uff23  ", "abc", "stone"]) == [
        "\uff21\uff22\uff23",
        "stone",
    ]
    assert validate_exclusion_terms(["  Stone  ", "stone", "glass"]) == [
        "Stone",
        "glass",
    ]
    with pytest.raises(ValueError, match="1〜100文字"):
        validate_exclusion_terms([""])


def test_prompt_sanitization_rejects_non_prompt_formats_and_options() -> None:
    with pytest.raises(ValueError, match="JSONまたはMarkdown"):
        sanitize_generated_prompt("```json\n{}\n```")
    with pytest.raises(ValueError, match="Midjourneyオプション"):
        sanitize_generated_prompt("paper sculpture --ar 4:5")


def test_length_assessment_counts_codepoints_and_hard_limit() -> None:
    assessment = assess_length("あいうえお", "あいうえおか", 1.0, 5)

    assert assessment.original_count == 5
    assert assessment.result_count == 6
    assert assessment.within_hard_limit is False
    assert assessment.status == "failed"


def test_workshop_generates_without_input_and_keeps_japanese_language(tmp_path: Path) -> None:
    context = _context(tmp_path)
    try:
        result = context.workshop_service.generate(
            count=2,
            chaos_level=3,
            output_language="ja",
            guidance="",
            deduplicate=False,
        )

        assert result["generated_count"] == 2
        assert result["status"] == "completed"
        assert all(item["language"] == "ja" for item in result["prompts"])
        assert all("visual variation" not in item["text"] for item in result["prompts"])
    finally:
        context.shutdown()


def test_generator_reports_partial_without_retrying_when_valid_results_are_fewer(
    tmp_path: Path,
) -> None:
    class PartialMock:
        def create_agent_response(
            self, agent_name: str, payload: dict[str, object]
        ) -> MockLLMResponse:
            assert agent_name == "PromptGeneratorAgent"
            return MockLLMResponse(
                output_json={
                    "requested_count": 2,
                    "prompts": [{"text": "paper sculpture", "language": "en"}],
                    "warnings": [],
                },
                response_id="mock_partial",
            )

    context = _context(tmp_path)
    try:
        context.orchestrator.mock_client = PartialMock()
        result = context.workshop_service.generate(
            count=2,
            chaos_level=1,
            output_language="en",
            guidance="",
            deduplicate=True,
        )

        assert result["status"] == "partial"
        assert result["generated_count"] == 1
        assert result["warnings"] == [
            "指定件数に届かなかったため、条件を確認して再実行できます。"
        ]
    finally:
        context.shutdown()


def test_exclusions_block_creative_operations_but_not_length_adjustment(tmp_path: Path) -> None:
    context = _context(tmp_path)
    try:
        context.set_prompt_exclusion_terms(["stone"])

        with pytest.raises(ValueError, match="除外語句"):
            context.workshop_service.generate(
                count=1,
                chaos_level=1,
                output_language="en",
                guidance="",
                deduplicate=True,
            )
        with pytest.raises(ValueError, match="除外語句"):
            context.workshop_service.transform(
                mode="worldbuilding",
                source_prompt="paper and stone --ar 4:5",
                output_language="source",
                max_characters=None,
                additional_guidance="",
            )

        adjusted = context.workshop_service.adjust_length(
            source_prompt="paper and stone --ar 4:5",
            length_ratio=1.0,
            max_characters=None,
        )
        assert "stone" in adjusted["prompt"]
        assert adjusted["exclusion_terms_applied"] is False
    finally:
        context.shutdown()


def test_text_output_setting_persists_and_applies_to_workshop_and_matrix(tmp_path: Path) -> None:
    context = _context(tmp_path)
    try:
        context.set_include_midjourney_options_in_text_output(False)
        arranged = context.workshop_service.arrange(
            source_prompt="paper sculpture --ar 4:5 --s 80",
            preset_id="auto",
            strength=1,
            additional_guidance="",
            length_ratio=1.0,
            max_characters=None,
            output_language="source",
        )
        assert "--ar" not in arranged["prompt"]
        assert "--s" not in arranged["prompt"]

        project, document = context.ensure_workspace()
        document.blocks.subject = "paper sculpture"
        document.parameters.aspect_ratio = "4:5"
        context.prompt_service.compile_document(document)
        assert "--ar" not in document.compiled_prompt
        assert "--ar" not in context.export_service.prompt_only(document)
        plan = context.matrix_service.plan_experiment("style comparison")
        variants = context.matrix_service.generate_and_save(
            project.id, plan, document.compiled_prompt
        )
        assert all("--" not in variant.prompt for variant in variants)
    finally:
        context.shutdown()

    reloaded = _context(tmp_path)
    try:
        assert reloaded.settings.include_midjourney_options_in_text_output is False
    finally:
        reloaded.shutdown()


def test_arrange_preset_catalog_has_auto_and_safe_public_metadata() -> None:
    catalog = load_arrange_presets()
    public = [preset.to_public_dict() for preset in catalog.presets]

    assert public[0]["id"] == "auto"
    assert len(public) > 1
    assert all("guidance" not in preset for preset in public)


def test_result_review_candidate_uses_the_same_text_output_policy(tmp_path: Path) -> None:
    context = _context(tmp_path)
    try:
        context.set_include_midjourney_options_in_text_output(False)
        project, document = context.ensure_workspace()
        document.blocks.subject = "paper sculpture"
        document.parameters.aspect_ratio = "4:5"
        context.prompt_service.compile_document(document)
        image = ResultImage.create(
            project.id,
            document.id,
            local_path="",
            prompt_snapshot="paper sculpture --ar 4:5",
            parameters_snapshot=document.parameters.iter_values(),
        )
        context.repository.save_result_image(image)
        review = context.result_review_service.review_result(image)

        assert "--ar" not in review.next_prompt_candidates[0]
        assert "paper sculpture" in review.next_prompt_candidates[0]
    finally:
        context.shutdown()
