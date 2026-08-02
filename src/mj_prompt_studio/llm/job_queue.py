from __future__ import annotations

from collections.abc import Callable
from concurrent.futures import Future, ThreadPoolExecutor
from dataclasses import asdict, dataclass, field
from datetime import datetime
from threading import Lock
from typing import Any, Literal

from mj_prompt_studio.config import LLM_EXECUTION_POLICY
from mj_prompt_studio.domain.prompt_document import new_id, utc_now
from mj_prompt_studio.llm.failure import (
    LLMFailureCode,
    LLMFailureStage,
    failure_diagnostics_for_exception,
    failure_message,
)

JobStatus = Literal["queued", "running", "succeeded", "failed", "cancelled"]
ExecutionBackend = Literal["openai", "mock", "unavailable"]
ResponseIDKind = Literal["openai", "mock"]
JobCallable = Callable[[], dict[str, Any]]
JobCallback = Callable[["LLMJob"], None]


@dataclass
class LLMJob:
    id: str
    agent_name: str
    model: str
    reasoning_effort: str
    text_verbosity: str
    status: JobStatus
    input_snapshot: dict[str, Any]
    output_json: dict[str, Any] | None = None
    error_message: str | None = None
    failure_code: LLMFailureCode | None = None
    failure_stage: LLMFailureStage | None = None
    provider_status_code: int | None = None
    provider_error_code: str | None = None
    created_at: datetime = field(default_factory=utc_now)
    finished_at: datetime | None = None
    retry_count: int = 0
    configured_mode: str = "real"
    execution_backend: ExecutionBackend = "unavailable"
    api_key_configured: bool = False
    response_id_kind: ResponseIDKind | None = None

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["created_at"] = self.created_at.isoformat()
        data["finished_at"] = self.finished_at.isoformat() if self.finished_at else None
        return data


class LLMJobQueue:
    def __init__(self, max_workers: int = 3, on_change: JobCallback | None = None) -> None:
        self._executor = ThreadPoolExecutor(max_workers=max_workers, thread_name_prefix="mjps-llm")
        self._jobs: dict[str, LLMJob] = {}
        self._futures: dict[str, Future[dict[str, Any]]] = {}
        self._callbacks: dict[str, JobCallback] = {}
        self._work_items: dict[str, JobCallable] = {}
        self._lock = Lock()
        self._on_change = on_change

    def submit(
        self,
        *,
        agent_name: str,
        input_snapshot: dict[str, Any],
        work: JobCallable,
        callback: JobCallback | None = None,
        configured_mode: str = "real",
        execution_backend: ExecutionBackend = "unavailable",
        api_key_configured: bool = False,
    ) -> LLMJob:
        job = LLMJob(
            id=new_id("job"),
            agent_name=agent_name,
            model=LLM_EXECUTION_POLICY.model,
            reasoning_effort=LLM_EXECUTION_POLICY.reasoning_effort,
            text_verbosity=LLM_EXECUTION_POLICY.text_verbosity,
            status="queued",
            input_snapshot=input_snapshot,
            configured_mode=configured_mode,
            execution_backend=execution_backend,
            api_key_configured=api_key_configured,
        )
        with self._lock:
            self._jobs[job.id] = job
            self._work_items[job.id] = work
            if callback:
                self._callbacks[job.id] = callback
        future = self._executor.submit(self._run, job.id, work)
        future.add_done_callback(lambda completed: self._complete(job.id, completed))
        with self._lock:
            self._futures[job.id] = future
        self._notify(job)
        return job

    def retry(self, job_id: str) -> LLMJob:
        with self._lock:
            job = self._jobs.get(job_id)
            if job is None:
                raise KeyError(job_id)
            if job.status != "failed":
                raise ValueError("Job can only be retried after failure")
            if job.failure_code == "structured_output_invalid" and job.retry_count >= 1:
                raise ValueError("Job retry limit reached")
            work = self._work_items.get(job_id)
            if work is None:
                raise ValueError(f"Job cannot be retried because work is not retained: {job_id}")
            job.retry_count += 1
            job.status = "queued"
            job.error_message = None
            job.failure_code = None
            job.failure_stage = None
            job.provider_status_code = None
            job.provider_error_code = None
            job.finished_at = None
            job.response_id_kind = None
            future = self._executor.submit(self._run, job.id, work)
            self._futures[job.id] = future
        future.add_done_callback(lambda completed: self._complete(job.id, completed))
        self._notify(job)
        return job

    def cancel(self, job_id: str) -> bool:
        with self._lock:
            future = self._futures.get(job_id)
            job = self._jobs.get(job_id)
        if future is None or job is None:
            return False
        cancelled = future.cancel()
        if cancelled:
            job.status = "cancelled"
            job.finished_at = utc_now()
            self._notify(job)
        return cancelled

    def list_jobs(self) -> list[LLMJob]:
        with self._lock:
            return list(self._jobs.values())

    def get(self, job_id: str) -> LLMJob | None:
        with self._lock:
            return self._jobs.get(job_id)

    def shutdown(self) -> None:
        self._executor.shutdown(wait=False, cancel_futures=True)

    def _run(self, job_id: str, work: JobCallable) -> dict[str, Any]:
        job = self.get(job_id)
        if job is None:
            raise KeyError(job_id)
        job.status = "running"
        self._notify(job)
        return work()

    def _complete(self, job_id: str, future: Future[dict[str, Any]]) -> None:
        output: dict[str, Any] | None = None
        diagnostics = None
        try:
            output = future.result()
        except Exception as exc:  # pragma: no cover - exercised by tests via behavior
            diagnostics = failure_diagnostics_for_exception(exc)
        with self._lock:
            job = self._jobs.get(job_id)
            if job is None:
                return
            if diagnostics is None:
                job.output_json = output
                job.status = "succeeded"
                job.response_id_kind = _response_id_kind_for_backend(job.execution_backend)
            elif job.status != "cancelled":
                job.failure_code = diagnostics.code
                job.failure_stage = diagnostics.stage
                job.provider_status_code = diagnostics.provider_status_code
                job.provider_error_code = diagnostics.provider_error_code
                job.error_message = failure_message(job.failure_code)
                job.status = "failed"
            job.finished_at = utc_now()
            callback = self._callbacks.get(job.id)
        self._notify(job)
        if callback:
            callback(job)

    def _notify(self, job: LLMJob) -> None:
        if self._on_change:
            self._on_change(job)


def _response_id_kind_for_backend(backend: ExecutionBackend) -> ResponseIDKind | None:
    if backend == "openai":
        return "openai"
    if backend == "mock":
        return "mock"
    return None
