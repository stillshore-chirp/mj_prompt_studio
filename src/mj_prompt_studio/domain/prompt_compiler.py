from __future__ import annotations

from dataclasses import dataclass

from mj_prompt_studio.domain.prompt_document import PromptDocument
from mj_prompt_studio.domain.prompt_output import PromptOutputRenderer, normalize_prompt_spaces
from mj_prompt_studio.domain.ruleset import GenerationRuleset


@dataclass(frozen=True)
class CompileResult:
    prompt: str
    token_estimate: int


class PromptCompiler:
    def __init__(self) -> None:
        self.renderer = PromptOutputRenderer()

    def compile(
        self,
        document: PromptDocument,
        ruleset: GenerationRuleset,
        *,
        include_midjourney_options: bool = True,
    ) -> CompileResult:
        body_parts = self._body_parts(document)
        prompt = self.renderer.render(
            ", ".join(part for part in body_parts if part),
            document.parameters,
            ruleset,
            include_midjourney_options=include_midjourney_options,
        )
        return CompileResult(
            prompt=normalize_prompt_spaces(prompt), token_estimate=_estimate_tokens(prompt)
        )

    def _body_parts(self, document: PromptDocument) -> list[str]:
        parts: list[str] = []
        for key, value in document.blocks.as_ordered_items():
            if key == "notes":
                continue
            if key == "text_in_image":
                text_items = [f'"{item.strip()}"' for item in value if str(item).strip()]
                parts.extend(text_items)
                continue
            if isinstance(value, str) and value.strip():
                parts.append(value.strip())
        return parts

def _estimate_tokens(value: str) -> int:
    if not value:
        return 0
    return max(1, round(len(value.split()) * 1.35))
