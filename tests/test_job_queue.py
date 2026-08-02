from threading import Event

from mj_prompt_studio.llm.job_queue import LLMJobQueue
from mj_prompt_studio.llm.orchestrator import LLMOutputValidationError


class _ProviderSchemaError(RuntimeError):
    status_code = 400
    body = {"error": {"message": "provider diagnostic: invalid response_format schema"}}


def test_job_queue_runs_work_and_reports_success() -> None:
    done = Event()
    seen = {}
    queue = LLMJobQueue(max_workers=1)

    def callback(job):
        seen["status"] = job.status
        seen["output"] = job.output_json
        done.set()

    queue.submit(
        agent_name="VocabularyAgent",
        input_snapshot={"text": "高級感"},
        work=lambda: {"ok": True},
        callback=callback,
    )

    assert done.wait(3)
    assert seen["status"] == "succeeded"
    assert seen["output"] == {"ok": True}
    queue.shutdown()


def test_job_queue_retries_retained_work() -> None:
    done = Event()
    calls = {"count": 0}
    queue = LLMJobQueue(max_workers=1)

    def work():
        calls["count"] += 1
        return {"count": calls["count"]}

    first = queue.submit(
        agent_name="VocabularyAgent",
        input_snapshot={"text": "高級感"},
        work=work,
        callback=lambda _job: done.set(),
    )

    assert done.wait(3)
    done.clear()
    queue.retry(first.id)
    assert done.wait(3)
    assert calls["count"] == 2
    assert first.model == "gpt-5.6-luna"
    assert first.reasoning_effort == "high"
    assert first.text_verbosity == "low"
    assert first.retry_count == 1
    queue.shutdown()


def test_job_queue_exposes_a_safe_failure_code_and_clears_it_before_retry() -> None:
    done = Event()
    calls = {"count": 0}
    queue = LLMJobQueue(max_workers=1)

    def work():
        calls["count"] += 1
        if calls["count"] == 1:
            raise _ProviderSchemaError()
        return {"ok": True}

    job = queue.submit(
        agent_name="IntentIntakeAgent",
        input_snapshot={"brief": "safe fixture"},
        work=work,
        callback=lambda _job: done.set(),
    )

    assert done.wait(3)
    assert job.status == "failed"
    assert job.failure_code == "structured_output_schema_invalid"
    assert job.failure_stage == "request"
    assert job.provider_status_code == 400
    assert job.provider_error_code is None
    assert job.error_message == "この操作に必要な構造化形式を実APIが受け付けませんでした。"
    assert "provider diagnostic" not in str(job.to_dict())

    done.clear()
    queue.retry(job.id)
    assert done.wait(3)
    assert job.status == "succeeded"
    assert job.failure_code is None
    assert job.failure_stage is None
    assert job.provider_status_code is None
    assert job.provider_error_code is None
    assert job.error_message is None
    queue.shutdown()


def test_job_queue_maps_semantic_llm_output_validation_to_structured_recovery() -> None:
    done = Event()
    queue = LLMJobQueue(max_workers=1)

    def work() -> dict[str, object]:
        raise LLMOutputValidationError()

    job = queue.submit(
        agent_name="PromptTransformAgent",
        input_snapshot={"mode": "worldbuilding"},
        work=work,
        callback=lambda _job: done.set(),
    )

    assert done.wait(3)
    assert job.status == "failed"
    assert job.failure_code == "structured_output_invalid"
    assert job.failure_stage == "semantic_validation"
    assert job.provider_status_code is None
    assert job.provider_error_code is None
    assert job.error_message == "実APIの応答をこの操作に必要な形式として確認できませんでした。"
    queue.shutdown()
