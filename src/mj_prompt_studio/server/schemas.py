from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class APIModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ProjectCreateRequest(APIModel):
    name: str = Field(min_length=1, max_length=160)
    title: str = Field(default="Untitled Prompt", max_length=160)


class BlocksUpdateRequest(APIModel):
    user_brief: str = ""
    blocks: dict[str, Any] = Field(default_factory=dict)
    parameters: dict[str, Any] = Field(default_factory=dict)
    notes: str = ""
    tags: list[str] = Field(default_factory=list)


class PatchApplyRequest(APIModel):
    patch: dict[str, Any]
    confirmed: bool = False


class AgentRequest(APIModel):
    document_id: str | None = None
    project_id: str | None = None
    reference_id: str | None = None
    result_image_id: str | None = None
    brief: str = ""
    text: str = ""
    mode: str = ""
    field_name: str = ""
    source_text: str = ""
    objective: str = ""


class ReferenceTagsRequest(APIModel):
    tags: list[str] = Field(default_factory=list)


class MatrixGenerateRequest(APIModel):
    project_id: str
    plan: dict[str, Any]
    base_prompt: str = ""


class MatrixExportRequest(APIModel):
    plan: dict[str, Any] | None = None
    variants: list[dict[str, Any]] = Field(default_factory=list)


class ResultCompareRequest(APIModel):
    project_id: str


class LLMFeaturePreferencesPayload(APIModel):
    vocabulary_amount: Literal["compact", "standard", "rich"]


class LLMFeaturePreferencesRequest(APIModel):
    preferences: dict[str, LLMFeaturePreferencesPayload]


class ResponseStorageRequest(APIModel):
    response_storage: Literal["normal", "privacy"]


class TextOutputOptionsRequest(APIModel):
    include_midjourney_options_in_text_output: bool


class ExclusionTermsRequest(APIModel):
    terms: list[str] = Field(max_length=200)


class PromptGeneratorRequest(APIModel):
    count: int = Field(default=10, ge=1, le=30)
    chaos_level: int = Field(default=1, ge=1, le=10)
    output_language: Literal["en", "ja"] = "en"
    guidance: str = Field(default="", max_length=2_000)
    deduplicate: bool = True


class PromptTransformRequest(APIModel):
    mode: Literal["worldbuilding", "chaos_mix"]
    source_prompt: str = Field(min_length=1, max_length=20_000)
    output_language: Literal["source", "en", "ja"] = "source"
    max_characters: int | None = Field(default=None, ge=100, le=5_000)
    additional_guidance: str = Field(default="", max_length=2_000)


class PromptLengthAdjustRequest(APIModel):
    source_prompt: str = Field(min_length=1, max_length=20_000)
    length_ratio: float = 1.0
    max_characters: int | None = Field(default=None, ge=50, le=5_000)

    @field_validator("length_ratio")
    @classmethod
    def validate_length_ratio(cls, value: float) -> float:
        if value not in {0.5, 0.8, 1.0, 1.2, 2.0}:
            raise ValueError("length_ratio must be one of 0.5, 0.8, 1.0, 1.2, 2.0")
        return value


class PromptArrangeRequest(APIModel):
    source_prompt: str = Field(min_length=1, max_length=20_000)
    preset_id: str = Field(default="auto", min_length=1, max_length=64)
    strength: int = Field(default=2, ge=0, le=3)
    additional_guidance: str = Field(default="", max_length=2_000)
    length_ratio: float = 1.0
    max_characters: int | None = Field(default=None, ge=50, le=5_000)
    output_language: Literal["source", "en", "ja"] = "source"

    @field_validator("length_ratio")
    @classmethod
    def validate_length_ratio(cls, value: float) -> float:
        if value not in {0.5, 0.8, 1.0, 1.2, 2.0}:
            raise ValueError("length_ratio must be one of 0.5, 0.8, 1.0, 1.2, 2.0")
        return value


class APIKeyRequest(APIModel):
    api_key: str = Field(min_length=1)


class ExportRequest(APIModel):
    document_id: str
    mode: Literal[
        "prompt",
        "markdown_record",
        "json_snapshot",
        "matrix_csv",
        "matrix_markdown",
    ]
    matrix_plan: dict[str, Any] | None = None
    matrix_variants: list[dict[str, Any]] = Field(default_factory=list)
