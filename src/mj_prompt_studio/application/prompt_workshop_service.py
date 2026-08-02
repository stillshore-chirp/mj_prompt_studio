from __future__ import annotations

from typing import Any

from mj_prompt_studio.domain.arrange_presets import ArrangePresetCatalog, load_arrange_presets
from mj_prompt_studio.domain.prompt_output import (
    PromptOutputRenderer,
    split_known_options,
)
from mj_prompt_studio.domain.prompt_workshop import (
    assess_length,
    exclusion_key,
    extract_anchors,
    matching_exclusion_terms,
    preserved_anchors,
    sanitize_generated_prompt,
)
from mj_prompt_studio.domain.ruleset import GenerationRuleset
from mj_prompt_studio.llm.orchestrator import LLMOrchestrator, LLMOutputValidationError


class PromptWorkshopService:
    def __init__(
        self,
        orchestrator: LLMOrchestrator,
        ruleset: GenerationRuleset,
        *,
        include_midjourney_options: bool,
        exclusion_terms: tuple[str, ...],
        preset_catalog: ArrangePresetCatalog | None = None,
    ) -> None:
        self.orchestrator = orchestrator
        self.ruleset = ruleset
        self.include_midjourney_options = include_midjourney_options
        self.exclusion_terms = exclusion_terms
        self.renderer = PromptOutputRenderer()
        self.preset_catalog = preset_catalog or load_arrange_presets()

    def available_arrange_presets(self) -> dict[str, Any]:
        return {
            "presets": [preset.to_public_dict() for preset in self.preset_catalog.presets],
            "warning": self.preset_catalog.warning,
        }

    def generate(
        self,
        *,
        count: int,
        chaos_level: int,
        output_language: str,
        guidance: str,
        deduplicate: bool,
    ) -> dict[str, Any]:
        result = self.orchestrator.run_agent(
            "PromptGeneratorAgent",
            {
                "count": count,
                "chaos_level": chaos_level,
                "output_language": output_language,
                "guidance": guidance,
                "exclusion_terms": list(self.exclusion_terms),
                "deduplicate": deduplicate,
            },
        ).output_json
        prompts: list[dict[str, str]] = []
        seen: set[str] = set()
        excluded_count = 0
        for item in result["prompts"]:
            text = self._sanitize_llm_prompt(str(item["text"]))
            if matching_exclusion_terms(text, self.exclusion_terms):
                excluded_count += 1
                continue
            key = exclusion_key(text)
            if deduplicate and key in seen:
                continue
            seen.add(key)
            prompts.append({"text": text, "language": str(item["language"])})
            if len(prompts) == count:
                break
        if not prompts:
            raise LLMOutputValidationError()
        warnings = [str(item) for item in result["warnings"]]
        if len(prompts) < count:
            warnings.append("指定件数に届かなかったため、条件を確認して再実行できます。")
        return {
            "target": "prompt_workshop",
            "operation": "generator",
            "requested_count": count,
            "generated_count": len(prompts),
            "excluded_count": excluded_count,
            "status": "completed" if len(prompts) == count else "partial",
            "prompts": prompts,
            "warnings": warnings,
        }

    def transform(
        self,
        *,
        mode: str,
        source_prompt: str,
        output_language: str,
        max_characters: int | None,
        additional_guidance: str,
    ) -> dict[str, Any]:
        if mode not in {"worldbuilding", "chaos_mix"}:
            raise ValueError("変換モードが不正です。")
        source = self._source_parts(source_prompt)
        anchors = extract_anchors(source.body)
        result = self.orchestrator.run_agent(
            "PromptTransformAgent",
            {
                "mode": mode,
                "source_prompt": source.body,
                "output_language": output_language,
                "max_characters": max_characters,
                "additional_guidance": additional_guidance,
                "anchors": anchors,
                "exclusion_terms": list(self.exclusion_terms),
            },
        ).output_json
        if result["mode"] != mode:
            raise LLMOutputValidationError()
        body = self._sanitize_llm_prompt(str(result["transformed_prompt"]))
        self._require_no_exclusion_match(body)
        if max_characters is not None and len(body) > max_characters:
            raise LLMOutputValidationError()
        return self._single_result(
            operation=mode,
            body=body,
            source_body=source.body,
            parameters=source.parameters,
            anchors=anchors,
            warnings=[str(item) for item in result["warnings"]],
            extra={
                "omitted_elements": [str(item) for item in result["omitted_elements"]],
                "output_language": output_language,
                "max_characters": max_characters,
            },
        )

    def adjust_length(
        self,
        *,
        source_prompt: str,
        length_ratio: float,
        max_characters: int | None,
    ) -> dict[str, Any]:
        source = self._source_parts(source_prompt)
        anchors = extract_anchors(source.body)
        body, assessment, repair_attempts, warnings = self._adjust_body(
            source.body,
            anchors,
            length_ratio=length_ratio,
            max_characters=max_characters,
        )
        return self._single_result(
            operation="length_adjust",
            body=body,
            source_body=source.body,
            parameters=source.parameters,
            anchors=anchors,
            warnings=warnings,
            extra={
                "length_ratio": length_ratio,
                "original_body_count": assessment.original_count,
                "target_count": assessment.target_count,
                "result_count": assessment.result_count,
                "max_characters": max_characters,
                "status": assessment.status,
                "quality_repair_attempts": repair_attempts,
                "exclusion_terms_applied": False,
            },
        )

    def arrange(
        self,
        *,
        source_prompt: str,
        preset_id: str,
        strength: int,
        additional_guidance: str,
        length_ratio: float,
        max_characters: int | None,
        output_language: str,
    ) -> dict[str, Any]:
        preset = self.preset_catalog.find(preset_id)
        source = self._source_parts(source_prompt)
        anchors = extract_anchors(source.body)
        result = self.orchestrator.run_agent(
            "PromptArrangeAgent",
            {
                "source_prompt": source.body,
                "preset_id": preset.preset_id,
                "preset_guidance": preset.guidance,
                "strength": strength,
                "additional_guidance": additional_guidance,
                "length_ratio": length_ratio,
                "max_characters": max_characters,
                "output_language": output_language,
                "anchors": anchors,
                "exclusion_terms": list(self.exclusion_terms),
            },
        ).output_json
        if result["applied_preset_id"] != preset_id or result["strength"] != strength:
            raise LLMOutputValidationError()
        body = self._sanitize_llm_prompt(str(result["arranged_prompt"]))
        self._require_no_exclusion_match(body)
        repair_attempts = 0
        warnings = [str(item) for item in result["warnings"]]
        assessment = assess_length(source.body, body, length_ratio, max_characters)
        if max_characters is not None and not assessment.within_hard_limit:
            body, assessment, repair_attempts, repair_warnings = self._adjust_body(
                body,
                anchors,
                length_ratio=1.0,
                max_characters=max_characters,
            )
            self._require_no_exclusion_match(body)
            warnings.extend(repair_warnings)
            assessment = assess_length(source.body, body, length_ratio, max_characters)
        return self._single_result(
            operation="arrange",
            body=body,
            source_body=source.body,
            parameters=source.parameters,
            anchors=anchors,
            warnings=warnings,
            extra={
                "preset_id": preset_id,
                "preset_label": preset.label_ja,
                "strength": strength,
                "length_ratio": length_ratio,
                "original_body_count": assessment.original_count,
                "target_count": assessment.target_count,
                "result_count": assessment.result_count,
                "max_characters": max_characters,
                "status": assessment.status,
                "quality_repair_attempts": repair_attempts,
            },
        )

    def _adjust_body(
        self,
        source_body: str,
        anchors: list[str],
        *,
        length_ratio: float,
        max_characters: int | None,
    ) -> tuple[str, Any, int, list[str]]:
        original_count = len(source_body)
        target_count = min(
            round(original_count * length_ratio),
            max_characters if max_characters is not None else round(original_count * length_ratio),
        )
        result = self.orchestrator.run_agent(
            "PromptLengthAdjustAgent",
            {
                "source_prompt": source_body,
                "length_ratio": length_ratio,
                "target_count": target_count,
                "max_characters": max_characters,
                "anchors": anchors,
            },
        ).output_json
        body = self._sanitize_llm_prompt(str(result["adjusted_prompt"]))
        assessment = assess_length(source_body, body, length_ratio, max_characters)
        repair_attempts = 0
        if max_characters is not None and not assessment.within_hard_limit:
            repair_attempts = 1
            result = self.orchestrator.run_agent(
                "PromptLengthAdjustAgent",
                {
                    "source_prompt": body,
                    "length_ratio": 1.0,
                    "target_count": max_characters,
                    "max_characters": max_characters,
                    "anchors": anchors,
                    "repair_required": True,
                },
            ).output_json
            body = self._sanitize_llm_prompt(str(result["adjusted_prompt"]))
            assessment = assess_length(source_body, body, length_ratio, max_characters)
        if not assessment.within_hard_limit:
            raise LLMOutputValidationError()
        warnings = [str(item) for item in result["warnings"]]
        if not assessment.within_ratio_tolerance:
            warnings.append("文字数目標との差が大きいため、結果文字数を確認して再実行できます。")
        return body, assessment, repair_attempts, warnings

    def _source_parts(self, source_prompt: str) -> Any:
        source = split_known_options(source_prompt, self.ruleset)
        if not source.body:
            raise ValueError("本文を入力してください。オプションだけでは実行できません。")
        return source

    def _single_result(
        self,
        *,
        operation: str,
        body: str,
        source_body: str,
        parameters: Any,
        anchors: list[str],
        warnings: list[str],
        extra: dict[str, Any],
    ) -> dict[str, Any]:
        retained = preserved_anchors(body, anchors)
        missing = [anchor for anchor in anchors if anchor not in retained]
        if missing:
            warnings = [*warnings, "一部の主要語句を本文で確認できませんでした。"]
        return {
            "target": "prompt_workshop",
            "operation": operation,
            "prompt": self.renderer.render(
                body,
                parameters,
                self.ruleset,
                include_midjourney_options=self.include_midjourney_options,
            ),
            "body": body,
            "source_body_count": len(source_body),
            "result_body_count": len(body),
            "preserved_anchors": retained,
            "preserved_anchor_count": len(retained),
            "warnings": warnings,
            **extra,
        }

    def _require_no_exclusion_match(self, body: str) -> None:
        if matching_exclusion_terms(body, self.exclusion_terms):
            raise LLMOutputValidationError()

    def _sanitize_llm_prompt(self, value: str) -> str:
        try:
            return sanitize_generated_prompt(value)
        except ValueError as exc:
            raise LLMOutputValidationError() from exc
