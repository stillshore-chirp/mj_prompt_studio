from __future__ import annotations

import json
import re
from dataclasses import dataclass
from importlib import resources
from typing import Any

PRESET_ID_PATTERN = re.compile(r"^[a-z][a-z0-9_]{0,63}$")


@dataclass(frozen=True)
class ArrangePreset:
    preset_id: str
    label_ja: str
    guidance: str
    category: str
    hybridization_profile: str | None = None

    def to_public_dict(self) -> dict[str, str | None]:
        return {
            "id": self.preset_id,
            "label_ja": self.label_ja,
            "category": self.category,
            "hybridization_profile": self.hybridization_profile,
        }


@dataclass(frozen=True)
class ArrangePresetCatalog:
    presets: tuple[ArrangePreset, ...]
    warning: str | None = None

    def find(self, preset_id: str) -> ArrangePreset:
        for preset in self.presets:
            if preset.preset_id == preset_id:
                return preset
        raise ValueError(
            "選択したアレンジプリセットは利用できません。再読み込みして選び直してください。"
        )


AUTO_PRESET = ArrangePreset(
    preset_id="auto",
    label_ja="自動",
    guidance=(
        "Keep the source subject and visual intent. "
        "Apply only the supplied guidance and strength."
    ),
    category="auto",
)


def load_arrange_presets() -> ArrangePresetCatalog:
    resource = resources.files("mj_prompt_studio.resources.templates").joinpath(
        "arrange_presets.json"
    )
    try:
        with resource.open("r", encoding="utf-8") as file:
            data = json.load(file)
        return catalog_from_payload(data)
    except (OSError, ValueError, json.JSONDecodeError, TypeError):
        return ArrangePresetCatalog(
            presets=(AUTO_PRESET,),
            warning="アレンジプリセットを読み込めませんでした。自動アレンジのみ利用できます。",
        )


def catalog_from_payload(data: Any) -> ArrangePresetCatalog:
    if not isinstance(data, dict) or not isinstance(data.get("presets"), list):
        raise ValueError("arrange preset catalog must contain a presets array")
    presets = [AUTO_PRESET]
    seen = {AUTO_PRESET.preset_id}
    for item in data["presets"]:
        if not isinstance(item, dict):
            raise ValueError("arrange preset entry must be an object")
        preset_id = str(item.get("id", ""))
        label = str(item.get("label_ja", item.get("label", ""))).strip()
        guidance = str(item.get("guidance", "")).strip()
        if not PRESET_ID_PATTERN.fullmatch(preset_id):
            raise ValueError("arrange preset id is invalid")
        if preset_id in seen:
            raise ValueError("arrange preset id is duplicated")
        if not 1 <= len(label) <= 80 or not 1 <= len(guidance) <= 4_000:
            raise ValueError("arrange preset entry has invalid text length")
        presets.append(
            ArrangePreset(
                preset_id=preset_id,
                label_ja=label,
                guidance=guidance,
                category=str(item.get("category", _category_for(preset_id))),
                hybridization_profile=_hybridization_profile_for(preset_id),
            )
        )
        seen.add(preset_id)
    return ArrangePresetCatalog(tuple(presets))


def _category_for(preset_id: str) -> str:
    if preset_id in {"fantasy", "dark_fantasy", "high_fantasy", "mythological"}:
        return "fantasy"
    if preset_id in {
        "cyberpunk",
        "solarpunk",
        "steampunk",
        "dieselpunk",
        "post_apocalyptic",
        "sci_fi",
        "biopunk",
        "afrofuturism",
    }:
        return "future"
    if preset_id in {"wafuu", "ukiyoe", "samurai", "ninja"}:
        return "japanese"
    if preset_id in {"palette_pastel", "palette_neon"}:
        return "palette"
    if preset_id in {"non_euclidean", "synesthesia", "pareidolia"}:
        return "perception"
    if preset_id in {
        "bio_luminescent_depths",
        "infrared_dreamscape",
        "magnetic_fluid",
        "time_dilation",
        "algorithmic_ornament",
        "hyperspace_blossom",
    }:
        return "experimental"
    return "style"


def _hybridization_profile_for(preset_id: str) -> str | None:
    if preset_id in {"cyberpunk", "noir", "sci_fi", "vaporwave"}:
        return preset_id
    return None
