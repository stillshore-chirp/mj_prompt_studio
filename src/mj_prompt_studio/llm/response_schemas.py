from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict

JsonDict = dict[str, Any]


class StructuredOutputSchemaError(ValueError):
    """Raised before a schema that strict Structured Outputs rejects is sent."""


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class PromptBriefModel(StrictModel):
    intent: str
    subject: str
    prompt_blocks: JsonDict
    suggested_parameters: JsonDict
    missing_decisions: list[JsonDict]


class VocabularyModel(StrictModel):
    suggestions: list[JsonDict]
    patches: list[JsonDict]


class PromptDoctorModel(StrictModel):
    summary: str
    issues: list[JsonDict]
    patches: list[JsonDict]
    next_actions: list[str]


class ParameterAdvisorModel(StrictModel):
    profile_name: str
    parameters: JsonDict
    rationale: list[str]


class ReferenceAnalysisModel(StrictModel):
    summary: str
    colors: list[str]
    lighting: str
    composition: str
    material_texture: str
    suggested_mode: str
    extracted_vocabulary: list[str]
    confidence: float


class MatrixPlanModel(StrictModel):
    objective: str
    fixed_conditions: JsonDict
    axes: list[JsonDict]
    evaluation_points: list[str]


class ResultReviewModel(StrictModel):
    scores: JsonDict
    strengths: list[str]
    issues: list[str]
    next_prompt_candidates: list[str]
    ai_summary: str


class FinalAuditModel(StrictModel):
    approved: bool
    summary: str
    warnings: list[str]
    patches: list[JsonDict]


class PromptCompileModel(StrictModel):
    compiled_prompt: str
    rationale: list[str]


class GeneratedPromptModel(StrictModel):
    text: str
    language: Literal["en", "ja"]


class PromptGeneratorModel(StrictModel):
    requested_count: int
    prompts: list[GeneratedPromptModel]
    warnings: list[str]


class PromptTransformModel(StrictModel):
    mode: Literal["worldbuilding", "chaos_mix"]
    transformed_prompt: str
    preserved_anchors: list[str]
    omitted_elements: list[str]
    warnings: list[str]


class PromptLengthAdjustModel(StrictModel):
    adjusted_prompt: str
    preserved_terms: list[str]
    warnings: list[str]


class PromptArrangeModel(StrictModel):
    arranged_prompt: str
    applied_preset_id: str
    strength: int
    preserved_anchors: list[str]
    warnings: list[str]


def strict_object(properties: JsonDict, required: list[str] | None = None) -> JsonDict:
    return {
        "type": "object",
        "required": required if required is not None else list(properties),
        "properties": properties,
        "additionalProperties": False,
    }


def string_array() -> JsonDict:
    return {"type": "array", "items": {"type": "string"}}


def nullable_string() -> JsonDict:
    return {"type": ["string", "null"]}


def nullable_integer() -> JsonDict:
    return {"type": ["integer", "null"]}


def nullable_boolean() -> JsonDict:
    return {"type": ["boolean", "null"]}


PROMPT_BLOCK_PROPERTIES: JsonDict = {
    "intent": {"type": "string"},
    "subject": {"type": "string"},
    "action_state": {"type": "string"},
    "environment": {"type": "string"},
    "composition": {"type": "string"},
    "camera_lens": {"type": "string"},
    "lighting": {"type": "string"},
    "material_texture": {"type": "string"},
    "color_palette": {"type": "string"},
    "style": {"type": "string"},
    "text_in_image": string_array(),
    "positive_constraints": {"type": "string"},
    "notes": {"type": "string"},
}

PROMPT_PARAMETER_PROPERTIES: JsonDict = {
    "aspect_ratio": nullable_string(),
    "raw": nullable_boolean(),
    "stylize": nullable_integer(),
    "chaos": nullable_integer(),
    "weird": nullable_integer(),
    "experimental": nullable_integer(),
    "tile": nullable_boolean(),
    "seed": nullable_integer(),
    "speed_mode": nullable_string(),
    "custom": strict_object({}, []),
}

PROMPT_PATCH_SCHEMA = strict_object(
    {
        "field_path": {"type": "string"},
        "old_value": {"type": "string"},
        "new_value": {"type": "string"},
        "reason": {"type": "string"},
        "confidence": {"type": "number"},
        "requires_user_confirmation": {"type": "boolean"},
    }
)

MISSING_DECISION_SCHEMA = strict_object(
    {
        "field_path": {"type": "string"},
        "question": {"type": "string"},
        "default_answer": {"type": "string"},
    }
)

VOCABULARY_SUGGESTION_SCHEMA = strict_object(
    {
        "source": {"type": "string"},
        "terms": string_array(),
    }
)

DOCTOR_ISSUE_SCHEMA = strict_object(
    {
        "severity": {"type": "string"},
        "code": {"type": "string"},
        "message": {"type": "string"},
        "field_path": {"type": "string"},
        "suggestion": {"type": "string"},
    }
)

MATRIX_AXIS_SCHEMA = strict_object(
    {
        "name": {"type": "string"},
        "values": string_array(),
        "description": {"type": "string"},
    }
)

RESULT_SCORE_SCHEMA = strict_object(
    {
        "prompt_adherence": {"type": "number"},
        "composition": {"type": "number"},
        "style_match": {"type": "number"},
        "material_quality": {"type": "number"},
        "text_accuracy": {"type": "number"},
        "commercial_usability": {"type": "number"},
    }
)


def schema(name: str, required: list[str], properties: JsonDict) -> JsonDict:
    return {
        "type": "json_schema",
        "name": name,
        "strict": True,
        "schema": strict_object(properties, required),
    }


GENERATED_PROMPT_SCHEMA = strict_object(
    {
        "text": {"type": "string"},
        "language": {"type": "string", "enum": ["en", "ja"]},
    }
)

PROMPT_TRANSFORM_SCHEMA = schema(
    "prompt_transform",
    ["mode", "transformed_prompt", "preserved_anchors", "omitted_elements", "warnings"],
    {
        "mode": {"type": "string", "enum": ["worldbuilding", "chaos_mix"]},
        "transformed_prompt": {"type": "string"},
        "preserved_anchors": string_array(),
        "omitted_elements": string_array(),
        "warnings": string_array(),
    },
)

PROMPT_LENGTH_ADJUST_SCHEMA = schema(
    "prompt_length_adjust",
    ["adjusted_prompt", "preserved_terms", "warnings"],
    {
        "adjusted_prompt": {"type": "string"},
        "preserved_terms": string_array(),
        "warnings": string_array(),
    },
)

PROMPT_ARRANGE_SCHEMA = schema(
    "prompt_arrange",
    ["arranged_prompt", "applied_preset_id", "strength", "preserved_anchors", "warnings"],
    {
        "arranged_prompt": {"type": "string"},
        "applied_preset_id": {"type": "string"},
        "strength": {"type": "integer"},
        "preserved_anchors": string_array(),
        "warnings": string_array(),
    },
)

PROMPT_GENERATOR_SCHEMA = schema(
    "prompt_generator",
    ["requested_count", "prompts", "warnings"],
    {
        "requested_count": {"type": "integer"},
        "prompts": {"type": "array", "items": GENERATED_PROMPT_SCHEMA},
        "warnings": string_array(),
    },
)


PROMPT_BRIEF_SCHEMA = schema(
    "prompt_brief",
    ["intent", "subject", "prompt_blocks", "suggested_parameters", "missing_decisions"],
    {
        "intent": {"type": "string"},
        "subject": {"type": "string"},
        "prompt_blocks": strict_object(PROMPT_BLOCK_PROPERTIES),
        "suggested_parameters": strict_object(PROMPT_PARAMETER_PROPERTIES),
        "missing_decisions": {"type": "array", "items": MISSING_DECISION_SCHEMA},
    },
)

VOCABULARY_SCHEMA = schema(
    "vocabulary_suggestions",
    ["suggestions", "patches"],
    {
        "suggestions": {"type": "array", "items": VOCABULARY_SUGGESTION_SCHEMA},
        "patches": {"type": "array", "items": PROMPT_PATCH_SCHEMA},
    },
)

PROMPT_DOCTOR_SCHEMA = schema(
    "prompt_doctor",
    ["summary", "issues", "patches", "next_actions"],
    {
        "summary": {"type": "string"},
        "issues": {"type": "array", "items": DOCTOR_ISSUE_SCHEMA},
        "patches": {"type": "array", "items": PROMPT_PATCH_SCHEMA},
        "next_actions": {"type": "array", "items": {"type": "string"}},
    },
)

PARAMETER_ADVISOR_SCHEMA = schema(
    "parameter_advisor",
    ["profile_name", "parameters", "rationale"],
    {
        "profile_name": {"type": "string"},
        "parameters": strict_object(PROMPT_PARAMETER_PROPERTIES),
        "rationale": {"type": "array", "items": {"type": "string"}},
    },
)

REFERENCE_ANALYSIS_SCHEMA = schema(
    "reference_analysis",
    [
        "summary",
        "colors",
        "lighting",
        "composition",
        "material_texture",
        "suggested_mode",
        "extracted_vocabulary",
        "confidence",
    ],
    {
        "summary": {"type": "string"},
        "colors": {"type": "array", "items": {"type": "string"}},
        "lighting": {"type": "string"},
        "composition": {"type": "string"},
        "material_texture": {"type": "string"},
        "suggested_mode": {"type": "string"},
        "extracted_vocabulary": {"type": "array", "items": {"type": "string"}},
        "confidence": {"type": "number"},
    },
)

MATRIX_PLAN_SCHEMA = schema(
    "matrix_plan",
    ["objective", "fixed_conditions", "axes", "evaluation_points"],
    {
        "objective": {"type": "string"},
        "fixed_conditions": strict_object(PROMPT_PARAMETER_PROPERTIES),
        "axes": {"type": "array", "items": MATRIX_AXIS_SCHEMA},
        "evaluation_points": {"type": "array", "items": {"type": "string"}},
    },
)

RESULT_REVIEW_SCHEMA = schema(
    "result_review",
    ["scores", "strengths", "issues", "next_prompt_candidates", "ai_summary"],
    {
        "scores": RESULT_SCORE_SCHEMA,
        "strengths": {"type": "array", "items": {"type": "string"}},
        "issues": {"type": "array", "items": {"type": "string"}},
        "next_prompt_candidates": {"type": "array", "items": {"type": "string"}},
        "ai_summary": {"type": "string"},
    },
)

FINAL_AUDIT_SCHEMA = schema(
    "final_audit",
    ["approved", "summary", "warnings", "patches"],
    {
        "approved": {"type": "boolean"},
        "summary": {"type": "string"},
        "warnings": {"type": "array", "items": {"type": "string"}},
        "patches": {"type": "array", "items": PROMPT_PATCH_SCHEMA},
    },
)

PROMPT_COMPILER_SCHEMA = schema(
    "prompt_compile",
    ["compiled_prompt", "rationale"],
    {
        "compiled_prompt": {"type": "string"},
        "rationale": {"type": "array", "items": {"type": "string"}},
    },
)

SCHEMAS: dict[str, JsonDict] = {
    "IntentIntakeAgent": PROMPT_BRIEF_SCHEMA,
    "VocabularyAgent": VOCABULARY_SCHEMA,
    "PromptCompilerAgent": PROMPT_COMPILER_SCHEMA,
    "PromptDoctorAgent": PROMPT_DOCTOR_SCHEMA,
    "ParameterAdvisorAgent": PARAMETER_ADVISOR_SCHEMA,
    "ReferenceAnalyzerAgent": REFERENCE_ANALYSIS_SCHEMA,
    "MatrixPlannerAgent": MATRIX_PLAN_SCHEMA,
    "ResultReviewAgent": RESULT_REVIEW_SCHEMA,
    "FinalAuditorAgent": FINAL_AUDIT_SCHEMA,
    "PromptGeneratorAgent": PROMPT_GENERATOR_SCHEMA,
    "PromptTransformAgent": PROMPT_TRANSFORM_SCHEMA,
    "PromptLengthAdjustAgent": PROMPT_LENGTH_ADJUST_SCHEMA,
    "PromptArrangeAgent": PROMPT_ARRANGE_SCHEMA,
}

MODELS: dict[str, type[BaseModel]] = {
    "IntentIntakeAgent": PromptBriefModel,
    "VocabularyAgent": VocabularyModel,
    "PromptCompilerAgent": PromptCompileModel,
    "PromptDoctorAgent": PromptDoctorModel,
    "ParameterAdvisorAgent": ParameterAdvisorModel,
    "ReferenceAnalyzerAgent": ReferenceAnalysisModel,
    "MatrixPlannerAgent": MatrixPlanModel,
    "ResultReviewAgent": ResultReviewModel,
    "FinalAuditorAgent": FinalAuditModel,
    "PromptGeneratorAgent": PromptGeneratorModel,
    "PromptTransformAgent": PromptTransformModel,
    "PromptLengthAdjustAgent": PromptLengthAdjustModel,
    "PromptArrangeAgent": PromptArrangeModel,
}


def validate_schema_payload(agent_name: str, payload: JsonDict) -> None:
    schema_config = SCHEMAS[agent_name]["schema"]
    required = schema_config["required"]
    missing = [key for key in required if key not in payload]
    if missing:
        raise ValueError(f"{agent_name} response is missing required keys: {', '.join(missing)}")
    MODELS[agent_name].model_validate(payload)


def schema_for_agent(agent_name: str) -> JsonDict:
    if agent_name not in SCHEMAS:
        raise KeyError(f"Unknown LLM agent: {agent_name}")
    schema_config = SCHEMAS[agent_name]
    validate_strict_response_schema(schema_config["schema"])
    return schema_config


def validate_strict_response_schema(schema_config: JsonDict) -> None:
    schema_type = schema_config.get("type")
    allowed_types = schema_type if isinstance(schema_type, list) else [schema_type]
    if "object" in allowed_types:
        properties = schema_config.get("properties")
        required = schema_config.get("required")
        if not isinstance(properties, dict) or not isinstance(required, list):
            raise StructuredOutputSchemaError("object schema requires properties and required")
        if schema_config.get("additionalProperties") is not False:
            raise StructuredOutputSchemaError("object schema must disallow additional properties")
        if set(required) != set(properties):
            raise StructuredOutputSchemaError("object schema must require every property")
        for child_schema in properties.values():
            if not isinstance(child_schema, dict):
                raise StructuredOutputSchemaError("property schema must be an object")
            validate_strict_response_schema(child_schema)
    if "array" in allowed_types:
        item_schema = schema_config.get("items")
        if not isinstance(item_schema, dict):
            raise StructuredOutputSchemaError("array schema requires an item schema")
        validate_strict_response_schema(item_schema)
