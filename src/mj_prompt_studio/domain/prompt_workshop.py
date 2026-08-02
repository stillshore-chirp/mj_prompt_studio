from __future__ import annotations

import re
import unicodedata
from collections.abc import Iterable
from dataclasses import dataclass

from mj_prompt_studio.domain.prompt_output import normalize_prompt_spaces

MAX_EXCLUSION_TERMS = 200
MAX_EXCLUSION_TERM_LENGTH = 100
MAX_EXCLUSION_INPUT_LENGTH = 20_000


@dataclass(frozen=True)
class LengthAssessment:
    original_count: int
    target_count: int
    result_count: int
    max_characters: int | None
    within_hard_limit: bool
    within_ratio_tolerance: bool

    @property
    def status(self) -> str:
        if not self.within_hard_limit:
            return "failed"
        return "completed" if self.within_ratio_tolerance else "completed_with_warning"


def normalize_exclusion_terms_for_storage(value: object) -> list[str]:
    if not isinstance(value, list):
        return []
    normalized: list[str] = []
    keys: set[str] = set()
    for item in value:
        if not isinstance(item, str):
            continue
        term = item.strip()
        if not _is_valid_exclusion_term(term):
            continue
        key = exclusion_key(term)
        if key and key not in keys:
            normalized.append(term)
            keys.add(key)
    return normalized[:MAX_EXCLUSION_TERMS]


def validate_exclusion_terms(terms: Iterable[str]) -> list[str]:
    source = list(terms)
    if len(source) > MAX_EXCLUSION_TERMS:
        raise ValueError(f"除外語句は最大{MAX_EXCLUSION_TERMS}件です。")
    if sum(len(item) for item in source) > MAX_EXCLUSION_INPUT_LENGTH:
        raise ValueError("除外語句の一括入力は20,000文字以内にしてください。")
    normalized: list[str] = []
    keys: set[str] = set()
    for item in source:
        term = item.strip()
        if not _is_valid_exclusion_term(term):
            raise ValueError("除外語句は1〜100文字の通常の文字列で入力してください。")
        key = exclusion_key(term)
        if key not in keys:
            normalized.append(term)
            keys.add(key)
    return normalized


def exclusion_key(value: str) -> str:
    return re.sub(r"\s+", " ", unicodedata.normalize("NFKC", value).casefold()).strip()


def matching_exclusion_terms(text: str, terms: Iterable[str]) -> list[str]:
    normalized_text = exclusion_key(text)
    return [term for term in terms if exclusion_key(term) in normalized_text]


def sanitize_generated_prompt(value: str) -> str:
    normalized = value.replace("\r\n", "\n").replace("\r", "\n").strip()
    normalized = re.sub(r"^(?:[-*•]\s+|\d+[.)]\s+)", "", normalized)
    normalized = normalize_prompt_spaces(normalized)
    if not normalized:
        raise ValueError("Prompt本文が空です。再試行してください。")
    if normalized.startswith(("{", "[")) or normalized[:3] == chr(96) * 3:
        raise ValueError("Prompt本文にJSONまたはMarkdownを含めることはできません。")
    if re.search(r"(^|\s)--\S+", normalized):
        raise ValueError("Prompt本文にMidjourneyオプションを含めることはできません。")
    return normalized


def extract_anchors(value: str, *, limit: int = 8) -> list[str]:
    candidates = re.split(r"[,、\uFF0C。;\uFF1B\n]+", normalize_prompt_spaces(value))
    anchors: list[str] = []
    seen: set[str] = set()
    for candidate in candidates:
        trimmed = candidate.strip().strip('"').strip("'")
        key = exclusion_key(trimmed)
        if len(trimmed) < 2 or not key or key in seen:
            continue
        anchors.append(trimmed)
        seen.add(key)
        if len(anchors) == limit:
            break
    return anchors


def preserved_anchors(text: str, anchors: Iterable[str]) -> list[str]:
    normalized = exclusion_key(text)
    return [anchor for anchor in anchors if exclusion_key(anchor) in normalized]


def count_prompt_characters(value: str) -> int:
    normalized = value.replace("\r\n", "\n").replace("\r", "\n").strip()
    return len(normalized)


def assess_length(
    original_body: str,
    result_body: str,
    length_ratio: float,
    max_characters: int | None,
) -> LengthAssessment:
    original_count = count_prompt_characters(original_body)
    target_count = round(original_count * length_ratio)
    effective_target = min(target_count, max_characters) if max_characters else target_count
    result_count = count_prompt_characters(result_body)
    tolerance = max(20, round(effective_target * 0.15))
    return LengthAssessment(
        original_count=original_count,
        target_count=effective_target,
        result_count=result_count,
        max_characters=max_characters,
        within_hard_limit=max_characters is None or result_count <= max_characters,
        within_ratio_tolerance=abs(result_count - effective_target) <= tolerance,
    )


def _is_valid_exclusion_term(value: str) -> bool:
    if not value or len(value) > MAX_EXCLUSION_TERM_LENGTH:
        return False
    return not any(
        character == "\x00" or unicodedata.category(character).startswith("C")
        for character in value
    )
