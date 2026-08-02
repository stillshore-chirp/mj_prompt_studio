import pytest

from mj_prompt_studio.config import (
    LLM_EXECUTION_POLICY,
    LLMFeaturePreferences,
    RuntimeSettings,
)
from mj_prompt_studio.llm.mock_client import MockLLMClient
from mj_prompt_studio.llm.orchestrator import LLMOrchestrator
from mj_prompt_studio.llm.response_schemas import (
    SCHEMAS,
    StructuredOutputSchemaError,
    schema_for_agent,
    validate_schema_payload,
    validate_strict_response_schema,
)


def test_mock_intent_agent_returns_schema_valid_payload(tmp_path) -> None:
    settings = RuntimeSettings(
        data_dir=tmp_path,
        llm_mode="mock",
        response_storage="normal",
    )
    orchestrator = LLMOrchestrator(settings)

    result = orchestrator.run_agent("IntentIntakeAgent", {"brief": "高級ホテルの朝食"})

    validate_schema_payload("IntentIntakeAgent", result.output_json)
    assert result.response_id is not None
    assert result.output_json["suggested_parameters"]["aspect_ratio"] == "4:5"


def test_schema_validation_rejects_wrong_types() -> None:
    invalid_payload = {
        "intent": "x",
        "subject": "y",
        "prompt_blocks": {},
        "suggested_parameters": {},
        "missing_decisions": "not a list",
    }

    try:
        validate_schema_payload("IntentIntakeAgent", invalid_payload)
    except Exception as exc:
        assert "missing_decisions" in str(exc)
    else:
        raise AssertionError("schema validation should fail")


def test_orchestrator_uses_fixed_execution_policy_and_vocabulary_preference(tmp_path) -> None:
    settings = RuntimeSettings(
        data_dir=tmp_path,
        llm_mode="mock",
        response_storage="normal",
    ).with_feature_preferences(
        {"VocabularyAgent": LLMFeaturePreferences(vocabulary_amount="compact")}
    )
    orchestrator = LLMOrchestrator(settings)

    result = orchestrator.run_agent("VocabularyAgent", {"text": "上質"})

    assert result.model == LLM_EXECUTION_POLICY.model
    assert result.reasoning_effort == LLM_EXECUTION_POLICY.reasoning_effort
    assert result.text_verbosity == LLM_EXECUTION_POLICY.text_verbosity
    assert len(result.output_json["suggestions"][0]["terms"]) == 2


def test_rich_vocabulary_setting_expands_mock_suggestions(tmp_path) -> None:
    settings = RuntimeSettings(
        data_dir=tmp_path,
        llm_mode="mock",
        response_storage="normal",
    ).with_feature_preferences({"VocabularyAgent": LLMFeaturePreferences(vocabulary_amount="rich")})
    orchestrator = LLMOrchestrator(settings)

    result = orchestrator.run_agent("VocabularyAgent", {"text": "上質"})

    assert result.model == LLM_EXECUTION_POLICY.model
    assert result.reasoning_effort == LLM_EXECUTION_POLICY.reasoning_effort
    assert len(result.output_json["suggestions"][0]["terms"]) == 5


def test_mock_payload_only_receives_model_independent_preferences(tmp_path) -> None:
    settings = RuntimeSettings(
        data_dir=tmp_path,
        llm_mode="mock",
        response_storage="normal",
    )
    orchestrator = LLMOrchestrator(settings)
    delegate = MockLLMClient()
    seen = {}

    class CapturingMock:
        def create_agent_response(self, agent_name, payload):
            seen.update(payload)
            return delegate.create_agent_response(agent_name, payload)

    orchestrator.mock_client = CapturingMock()
    orchestrator.run_agent("VocabularyAgent", {"text": "上質"})

    assert seen["llm_preferences"] == {"vocabulary_amount": "standard"}


def test_mock_agent_payloads_match_strict_response_schemas(tmp_path) -> None:
    settings = RuntimeSettings(
        data_dir=tmp_path,
        llm_mode="mock",
        response_storage="normal",
    )
    orchestrator = LLMOrchestrator(settings)
    payloads = {
        "IntentIntakeAgent": {"brief": "高級ホテルの朝食"},
        "VocabularyAgent": {"text": "上質"},
        "PromptCompilerAgent": {"compiled_prompt": "premium breakfast"},
        "PromptDoctorAgent": {"compiled_prompt": "premium breakfast"},
        "ParameterAdvisorAgent": {"objective": "商用品質を安定させる"},
        "ReferenceAnalyzerAgent": {"name": "reference", "tags": []},
        "MatrixPlannerAgent": {"objective": "構図比較"},
        "ResultReviewAgent": {
            "prompt": "premium breakfast",
            "parameters": {},
            "image_metadata": {},
        },
        "FinalAuditorAgent": {"prompt": "premium breakfast", "validation": {}},
        "PromptGeneratorAgent": {
            "count": 2,
            "chaos_level": 3,
            "output_language": "en",
        },
        "PromptTransformAgent": {
            "mode": "worldbuilding",
            "source_prompt": "paper sculpture",
        },
        "PromptLengthAdjustAgent": {
            "source_prompt": "paper sculpture",
            "target_count": 20,
        },
        "PromptArrangeAgent": {
            "source_prompt": "paper sculpture",
            "preset_id": "auto",
            "strength": 1,
        },
    }

    for agent_name, payload in payloads.items():
        result = orchestrator.run_agent(agent_name, payload)
        assert result.model == "gpt-5.6-luna"
        assert result.reasoning_effort == "high"
        assert result.text_verbosity == "low"
        _assert_matches_json_schema(result.output_json, schema_for_agent(agent_name)["schema"])


def test_all_agent_response_schemas_pass_strict_structured_output_preflight() -> None:
    for agent_name in SCHEMAS:
        assert schema_for_agent(agent_name)["name"]


def test_strict_schema_preflight_rejects_objects_with_optional_fields() -> None:
    with pytest.raises(StructuredOutputSchemaError, match="require every property"):
        validate_strict_response_schema(
            {
                "type": "object",
                "properties": {"value": {"type": "string"}},
                "required": [],
                "additionalProperties": False,
            }
        )


def _assert_matches_json_schema(value: object, schema: dict[str, object]) -> None:
    schema_type = schema.get("type")
    allowed_types = schema_type if isinstance(schema_type, list) else [schema_type]
    if value is None:
        assert "null" in allowed_types
        return
    if "object" in allowed_types:
        assert isinstance(value, dict)
        required = schema.get("required", [])
        assert isinstance(required, list)
        for key in required:
            assert key in value
        properties = schema.get("properties", {})
        assert isinstance(properties, dict)
        if schema.get("additionalProperties") is False:
            assert set(value) <= set(properties)
        for key, child_schema in properties.items():
            if key in value:
                assert isinstance(child_schema, dict)
                _assert_matches_json_schema(value[key], child_schema)
        return
    if "array" in allowed_types:
        assert isinstance(value, list)
        item_schema = schema.get("items", {})
        assert isinstance(item_schema, dict)
        for item in value:
            _assert_matches_json_schema(item, item_schema)
        return
    if "string" in allowed_types:
        assert isinstance(value, str)
        return
    if "integer" in allowed_types:
        assert isinstance(value, int)
        return
    if "number" in allowed_types:
        assert isinstance(value, int | float)
        return
    if "boolean" in allowed_types:
        assert isinstance(value, bool)
        return
    raise AssertionError(f"Unsupported schema type: {schema_type}")
