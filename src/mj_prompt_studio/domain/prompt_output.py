from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any

from mj_prompt_studio.domain.prompt_document import PromptParameters
from mj_prompt_studio.domain.ruleset import GenerationRuleset, ParameterSpec


@dataclass(frozen=True)
class PromptParts:
    body: str
    parameters: PromptParameters


class PromptOutputRenderer:
    """Renders presentation text without mutating structured PromptParameters."""

    def render(
        self,
        body: str,
        parameters: PromptParameters,
        ruleset: GenerationRuleset,
        *,
        include_midjourney_options: bool,
    ) -> str:
        normalized_body = normalize_prompt_spaces(body)
        if not normalized_body:
            return ""
        if not include_midjourney_options:
            return normalized_body
        return normalize_prompt_spaces(
            " ".join([normalized_body, *self.parameter_parts(parameters, ruleset)])
        )

    def parameter_parts(
        self, parameters: PromptParameters, ruleset: GenerationRuleset
    ) -> list[str]:
        values = parameters.iter_values()
        rendered: list[str] = []
        for name in ruleset.output_order:
            spec = ruleset.parameters.get(name)
            if spec is None or not spec.export_enabled:
                continue
            part = self.render_parameter(spec, values.get(name))
            if part:
                rendered.append(part)
        return rendered

    def render_parameter(self, spec: ParameterSpec, value: Any) -> str:
        if value is None or value == "":
            return ""
        if spec.kind == "boolean":
            return spec.flag if bool(value) else ""
        if spec.kind == "enum" and str(value) not in spec.choices:
            return ""
        return f"{spec.flag} {value}".strip() if spec.flag else str(value)


def split_known_options(value: str, ruleset: GenerationRuleset) -> PromptParts:
    """Split only a recognised continuous option suffix from text."""

    tokens = normalize_prompt_spaces(value).split()
    parameters: dict[str, Any] = {}
    flags = {
        spec.flag: (name, spec)
        for name, spec in ruleset.parameters.items()
        if spec.export_enabled and spec.flag
    }
    index = len(tokens) - 1
    while index >= 0:
        current = flags.get(tokens[index])
        if current is not None and current[1].kind == "boolean":
            parameters[current[0]] = True
            index -= 1
            continue
        if index < 1:
            break
        previous = flags.get(tokens[index - 1])
        if previous is None or previous[1].kind == "boolean":
            break
        parsed = _parse_option_value(previous[1], tokens[index])
        if parsed is _INVALID:
            break
        parameters[previous[0]] = parsed
        index -= 2
    return PromptParts(
        body=" ".join(tokens[: index + 1]),
        parameters=PromptParameters.from_dict(parameters),
    )


def normalize_prompt_spaces(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


_INVALID = object()


def _parse_option_value(spec: ParameterSpec, value: str) -> object:
    if spec.kind == "enum":
        return value if value in spec.choices else _INVALID
    if spec.kind == "integer":
        try:
            return int(value)
        except ValueError:
            return _INVALID
    if spec.kind == "number":
        try:
            return float(value)
        except ValueError:
            return _INVALID
    return value
