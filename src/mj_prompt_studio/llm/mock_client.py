from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from uuid import uuid4


@dataclass(frozen=True)
class MockLLMResponse:
    output_json: dict[str, Any]
    response_id: str


class MockLLMClient:
    def create_agent_response(self, agent_name: str, payload: dict[str, Any]) -> MockLLMResponse:
        factory = {
            "IntentIntakeAgent": _intent_response,
            "VocabularyAgent": _vocabulary_response,
            "PromptCompilerAgent": _compiler_response,
            "PromptDoctorAgent": _doctor_response,
            "ParameterAdvisorAgent": _parameter_response,
            "ReferenceAnalyzerAgent": _reference_response,
            "MatrixPlannerAgent": _matrix_response,
            "ResultReviewAgent": _result_review_response,
            "FinalAuditorAgent": _final_audit_response,
            "PromptGeneratorAgent": _prompt_generator_response,
            "PromptTransformAgent": _prompt_transform_response,
            "PromptLengthAdjustAgent": _prompt_length_adjust_response,
            "PromptArrangeAgent": _prompt_arrange_response,
        }.get(agent_name)
        if factory is None:
            raise KeyError(f"Unknown mock agent: {agent_name}")
        return MockLLMResponse(output_json=factory(payload), response_id=f"mock_{uuid4().hex}")


def _intent_response(payload: dict[str, Any]) -> dict[str, Any]:
    brief = str(payload.get("brief", ""))
    subject = (
        "hotel breakfast table"
        if "朝食" in brief or "breakfast" in brief.lower()
        else "main subject"
    )
    return {
        "intent": "premium editorial product photography",
        "subject": subject,
        "prompt_blocks": _prompt_blocks(
            {
                "intent": "premium editorial product photography",
                "subject": "croissant, coffee cup, refined tableware",
                "environment": "quiet luxury hotel breakfast table",
                "composition": "generous negative space, close-to-medium tabletop layout",
                "camera_lens": "85mm product photography, shallow depth of field",
                "lighting": "soft morning window light, warm highlights",
                "material_texture": "linen napkin, ceramic cup, natural bread crust",
                "color_palette": "warm ivory, walnut brown, muted gold",
                "style": "clean commercial editorial finish",
                "positive_constraints": "unoccupied table, no visible person, brand-safe setting",
            }
        ),
        "suggested_parameters": _parameter_payload(
            aspect_ratio="4:5",
            raw=True,
            stylize=80,
            chaos=5,
            weird=0,
            experimental=0,
            seed=123456,
        ),
        "missing_decisions": [
            {
                "field_path": "blocks.camera_lens",
                "question": "寄りか俯瞰寄りかを選ぶと比較しやすくなります。",
                "default_answer": "close-to-medium product shot",
            }
        ],
    }


def _prompt_blocks(overrides: dict[str, Any]) -> dict[str, Any]:
    defaults: dict[str, Any] = {
        "intent": "",
        "subject": "",
        "action_state": "",
        "environment": "",
        "composition": "",
        "camera_lens": "",
        "lighting": "",
        "material_texture": "",
        "color_palette": "",
        "style": "",
        "text_in_image": [],
        "positive_constraints": "",
        "notes": "",
    }
    return {**defaults, **overrides}


def _parameter_payload(**overrides: Any) -> dict[str, Any]:
    defaults: dict[str, Any] = {
        "aspect_ratio": None,
        "raw": None,
        "stylize": None,
        "chaos": None,
        "weird": None,
        "experimental": None,
        "tile": None,
        "seed": None,
        "speed_mode": None,
        "custom": {},
    }
    return {**defaults, **overrides}


def _vocabulary_response(payload: dict[str, Any]) -> dict[str, Any]:
    text = str(payload.get("text", ""))
    terms = _select_terms(
        payload,
        [
            "premium editorial finish",
            "restrained warm palette",
            "refined material detail",
            "quiet luxury atmosphere",
            "clean commercial composition",
        ],
    )
    return {
        "suggestions": [
            {
                "source": text or "高級感",
                "terms": terms,
            }
        ],
        "patches": [
            {
                "field_path": "blocks.style",
                "old_value": text,
                "new_value": "premium editorial finish, refined material detail",
                "reason": "曖昧語を画像生成向け語彙へ展開します。",
                "confidence": 0.82,
                "requires_user_confirmation": True,
            }
        ],
    }


def _compiler_response(payload: dict[str, Any]) -> dict[str, Any]:
    compiled = str(payload.get("compiled_prompt", "")).strip()
    return {
        "compiled_prompt": compiled,
        "rationale": ["Rulesetで対応するパラメータを末尾に集約しました。"],
    }


def _doctor_response(payload: dict[str, Any]) -> dict[str, Any]:
    return {
        "summary": "全体の方向性は明確です。照明と構図を少し具体化できます。",
        "issues": [
            {
                "severity": "warning",
                "code": "weak_composition",
                "message": "背景とカメラ距離の指定が弱いため、結果が散る可能性があります。",
                "field_path": "blocks.composition",
                "suggestion": "構図、距離、背景の条件を固定します。",
            }
        ],
        "patches": [
            {
                "field_path": "blocks.composition",
                "old_value": payload.get("composition", ""),
                "new_value": "generous negative space, close-to-medium tabletop composition",
                "reason": "構図の比較軸を明確にします。",
                "confidence": 0.78,
                "requires_user_confirmation": True,
            }
        ],
        "next_actions": ["照明を強調する", "背景を具体化する", "構図を固定する"],
    }


def _parameter_response(payload: dict[str, Any]) -> dict[str, Any]:
    objective = str(payload.get("objective", ""))
    exploratory = "探索" in objective or "variation" in objective.lower()
    return {
        "profile_name": "Exploration Balanced" if exploratory else "Precision Balanced",
        "parameters": _parameter_payload(
            raw=not exploratory,
            stylize=120 if exploratory else 80,
            chaos=18 if exploratory else 5,
            weird=5 if exploratory else 0,
            experimental=20 if exploratory else 0,
        ),
        "rationale": [
            "商用利用を想定し、形状安定性を優先します。",
            "探索目的では多様性を少し上げます。",
        ],
    }


def _reference_response(payload: dict[str, Any]) -> dict[str, Any]:
    name = str(payload.get("name", "reference image"))
    extracted_vocabulary = _select_terms(
        payload,
        [
            "soft morning window light",
            "clean negative space",
            "refined ceramic texture",
            "premium hotel breakfast atmosphere",
            "warm natural highlights",
        ],
    )
    return {
        "summary": f"{name}は明るい自然光、清潔な構図、上質な質感の参照素材です。",
        "colors": ["warm ivory", "walnut brown", "muted gold", "soft blue gray"],
        "lighting": "soft natural side light",
        "composition": "tabletop composition with generous negative space",
        "material_texture": "ceramic, linen, natural bread crust",
        "suggested_mode": "style_reference",
        "extracted_vocabulary": extracted_vocabulary,
        "confidence": 0.86,
    }


def _matrix_response(payload: dict[str, Any]) -> dict[str, Any]:
    objective = str(payload.get("objective", "スタイルと構図の比較"))
    return {
        "objective": objective,
        "fixed_conditions": _parameter_payload(aspect_ratio="4:5", seed=123456),
        "axes": [
            {"name": "stylize", "values": ["60", "100", "140"], "description": "スタイル強度"},
            {"name": "chaos", "values": ["0", "8"], "description": "多様性"},
        ],
        "evaluation_points": ["prompt adherence", "style match", "commercial usability"],
    }


def _result_review_response(payload: dict[str, Any]) -> dict[str, Any]:
    prompt = str(payload.get("prompt", ""))
    next_prompt = f"{prompt}, clearer focal subject, refined highlights".strip(", ")
    return {
        "scores": {
            "prompt_adherence": 8.6,
            "composition": 8.2,
            "style_match": 8.1,
            "material_quality": 8.4,
            "text_accuracy": 7.8,
            "commercial_usability": 8.3,
        },
        "strengths": ["自然光の雰囲気が良い", "素材の質感が読み取りやすい"],
        "issues": ["焦点が少し散る", "背景説明をもう少し固定できる"],
        "next_prompt_candidates": [next_prompt],
        "ai_summary": "全体に高品質ですが、焦点と背景条件を固定すると再現性が上がります。",
    }


def _final_audit_response(payload: dict[str, Any]) -> dict[str, Any]:
    prompt = str(payload.get("prompt", ""))
    warnings = []
    if "version" in prompt.lower():
        warnings.append("ユーザー向け文言に不要なバージョン表記らしき語があります。")
    return {
        "approved": not warnings,
        "summary": "コピー前の最終監査を完了しました。",
        "warnings": warnings,
        "patches": [],
    }


def _prompt_generator_response(payload: dict[str, Any]) -> dict[str, Any]:
    requested_count = int(payload.get("count", 10))
    language = str(payload.get("output_language", "en"))
    prompts = [
        (
            {
                "text": (
                    "静かな朝の光に包まれた抽象的な展示空間、"
                    "層状の紙と石の質感、余白のある構図"
                ),
                "language": "ja",
            }
            if language == "ja"
            else {
                "text": (
                    "quiet abstract exhibition space in early morning light, "
                    "layered paper and stone "
                    "textures, generous negative space"
                ),
                "language": "en",
            }
        )
        for _index in range(requested_count)
    ]
    for index, prompt in enumerate(prompts, start=1):
        variation = f"、案{index}" if language == "ja" else f", visual variation {index}"
        prompt["text"] = f"{prompt['text']}{variation}"
    return {"requested_count": requested_count, "prompts": prompts, "warnings": []}


def _prompt_transform_response(payload: dict[str, Any]) -> dict[str, Any]:
    source = str(payload.get("source_prompt", "")).strip()
    mode = str(payload.get("mode", "worldbuilding"))
    suffix = (
        "同じ空間と瞬間で意図的に衝突させる、読みやすい単一シーン"
        if mode == "chaos_mix"
        else "一枚の画像として自然につながる光、空間関係、素材の流れ"
    )
    transformed = f"{source}, {suffix}" if source else suffix
    anchors = payload.get("anchors", [])
    return {
        "mode": mode,
        "transformed_prompt": transformed,
        "preserved_anchors": anchors if isinstance(anchors, list) else [],
        "omitted_elements": [],
        "warnings": [],
    }


def _prompt_length_adjust_response(payload: dict[str, Any]) -> dict[str, Any]:
    source = str(payload.get("source_prompt", "")).strip()
    target = max(1, int(payload.get("target_count", len(source))))
    words = source.split()
    if len(source) > target and words:
        result_parts: list[str] = []
        for word in words:
            candidate = " ".join([*result_parts, word]).strip()
            if len(candidate) > target:
                break
            result_parts.append(word)
        result = " ".join(result_parts) or words[0]
    elif len(source) < target:
        result = f"{source}, refined light, material texture, and spatial relation".strip(", ")
    else:
        result = source
    return {
        "adjusted_prompt": result,
        "preserved_terms": payload.get("anchors", [])
        if isinstance(payload.get("anchors", []), list)
        else [],
        "warnings": [],
    }


def _prompt_arrange_response(payload: dict[str, Any]) -> dict[str, Any]:
    source = str(payload.get("source_prompt", "")).strip()
    preset_id = str(payload.get("preset_id", "auto"))
    strength = int(payload.get("strength", 2))
    suffix = "refined visual atmosphere and coherent material detail"
    return {
        "arranged_prompt": f"{source}, {suffix}".strip(", "),
        "applied_preset_id": preset_id,
        "strength": strength,
        "preserved_anchors": payload.get("anchors", [])
        if isinstance(payload.get("anchors", []), list)
        else [],
        "warnings": [],
    }


def _select_terms(payload: dict[str, Any], terms: list[str]) -> list[str]:
    amount = _vocabulary_amount(payload)
    limit_by_amount = {"compact": 2, "standard": 3, "rich": 5}
    return terms[: limit_by_amount.get(amount, 3)]


def _vocabulary_amount(payload: dict[str, Any]) -> str:
    preferences = payload.get("llm_preferences", {})
    if not isinstance(preferences, dict):
        return "standard"
    return str(preferences.get("vocabulary_amount", "standard"))
