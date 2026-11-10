from __future__ import annotations

from collections.abc import Callable, Mapping
from dataclasses import dataclass
import hashlib
import hmac
import logging
import re
from typing import Protocol, TypeAlias

from ..config import Settings

TraceValue: TypeAlias = str | int | float | bool | None

_METADATA_KEYS = {
    "document_scope_count",
    "context_token_budget",
    "context_chunk_count",
    "model",
    "retrieved_chunk_count",
    "status",
}
_OUTPUT_KEYS = {
    "status",
    "citation_count",
    "retrieved_chunk_count",
    "context_chunk_count",
    "used_citation_count",
}
_CONTENT_INPUT_KEYS = {"question"}
_CONTENT_OUTPUT_KEYS = {"answer"}
_STATUS_VALUES = {"started", "completed", "insufficient_evidence", "failed"}
_ERROR_CATEGORIES = {"provider_error", "pipeline_error"}
_SAFE_MODEL = re.compile(r"^[A-Za-z0-9._:/-]{1,128}$")


@dataclass(frozen=True)
class TraceContext:
    user_id: str
    conversation_id: str
    message_id: str


class TraceRun(Protocol):
    def start_child(
        self,
        name: str,
        *,
        run_type: str,
        metadata: Mapping[str, TraceValue],
    ) -> TraceRun: ...

    def end(
        self,
        *,
        outputs: Mapping[str, TraceValue] | None = None,
        error_category: str | None = None,
    ) -> None: ...


class Observer(Protocol):
    def start_run(
        self,
        name: str,
        *,
        run_type: str,
        metadata: Mapping[str, TraceValue],
        context: TraceContext | None = None,
        inputs: Mapping[str, TraceValue] | None = None,
    ) -> TraceRun: ...


def _warn(logger: Callable[[str], None], message: str) -> None:
    try:
        logger(message)
    except Exception:
        pass


def _safe_values(values: Mapping[str, TraceValue] | None, allowed: set[str]) -> dict[str, TraceValue]:
    safe: dict[str, TraceValue] = {}
    for key, value in (values or {}).items():
        if key not in allowed or not isinstance(value, (str, int, float, bool, type(None))):
            continue
        if key == "status" and value not in _STATUS_VALUES:
            continue
        if key == "model" and (not isinstance(value, str) or _SAFE_MODEL.fullmatch(value) is None):
            continue
        safe[key] = value
    return safe


def _hash_identifier(value: str, salt: str) -> str:
    return hmac.new(salt.encode("utf-8"), value.encode("utf-8"), hashlib.sha256).hexdigest()


class NoOpTraceRun:
    def start_child(
        self,
        name: str,
        *,
        run_type: str,
        metadata: Mapping[str, TraceValue],
    ) -> TraceRun:
        return self

    def end(
        self,
        *,
        outputs: Mapping[str, TraceValue] | None = None,
        error_category: str | None = None,
    ) -> None:
        return None


class NoOpObserver:
    def start_run(
        self,
        name: str,
        *,
        run_type: str,
        metadata: Mapping[str, TraceValue],
        context: TraceContext | None = None,
        inputs: Mapping[str, TraceValue] | None = None,
    ) -> TraceRun:
        return NoOpTraceRun()


class _LangSmithRun:
    def __init__(self, run, warning_logger: Callable[[str], None], capture_content: bool = False):
        self._run = run
        self._warning_logger = warning_logger
        self._capture_content = capture_content
        self._ended = False

    def start_child(
        self,
        name: str,
        *,
        run_type: str,
        metadata: Mapping[str, TraceValue],
    ) -> TraceRun:
        try:
            child = self._run.create_child(
                name=name,
                run_type=run_type,
                inputs={},
                extra={"metadata": _safe_values(metadata, _METADATA_KEYS)},
            )
            child.post()
            return _LangSmithRun(child, self._warning_logger)
        except Exception:
            _warn(self._warning_logger, "LangSmith tracing operation failed")
            return NoOpTraceRun()

    def end(
        self,
        *,
        outputs: Mapping[str, TraceValue] | None = None,
        error_category: str | None = None,
    ) -> None:
        if self._ended:
            return
        self._ended = True
        try:
            error = error_category if error_category in _ERROR_CATEGORIES else None
            safe_outputs = _safe_values(outputs, _OUTPUT_KEYS)
            if self._capture_content:
                safe_outputs.update(_safe_values(outputs, _CONTENT_OUTPUT_KEYS))
            self._run.end(outputs=safe_outputs, error=error)
            self._run.patch()
        except Exception:
            _warn(self._warning_logger, "LangSmith tracing operation failed")


class _LangSmithObserver:
    def __init__(
        self,
        run_factory: Callable[..., object],
        hash_salt: str,
        warning_logger: Callable[[str], None],
        capture_content: bool = False,
    ):
        self._run_factory = run_factory
        self._hash_salt = hash_salt
        self._warning_logger = warning_logger
        self._capture_content = capture_content

    def start_run(
        self,
        name: str,
        *,
        run_type: str,
        metadata: Mapping[str, TraceValue],
        context: TraceContext | None = None,
        inputs: Mapping[str, TraceValue] | None = None,
    ) -> TraceRun:
        capture_content = self._capture_content and name == "rag.answer"
        safe_metadata = _safe_values(metadata, _METADATA_KEYS)
        if context is not None:
            safe_metadata.update({
                "user_hash": _hash_identifier(context.user_id, self._hash_salt),
                "conversation_hash": _hash_identifier(context.conversation_id, self._hash_salt),
                "message_hash": _hash_identifier(context.message_id, self._hash_salt),
            })
        try:
            run = self._run_factory(
                name=name,
                run_type=run_type,
                inputs=_safe_values(inputs, _CONTENT_INPUT_KEYS) if capture_content else {},
                extra={"metadata": safe_metadata},
            )
            run.post()
            return _LangSmithRun(run, self._warning_logger, capture_content)
        except Exception:
            _warn(self._warning_logger, "LangSmith tracing operation failed")
            return NoOpTraceRun()


def build_observer(
    settings: Settings,
    *,
    run_factory: Callable[..., object] | None = None,
    warning_logger: Callable[[str], None] | None = None,
) -> Observer:
    logger = warning_logger or logging.getLogger(__name__).warning
    if not settings.langsmith_tracing:
        return NoOpObserver()
    if not settings.langsmith_api_key or not settings.langsmith_hash_salt:
        _warn(logger, "LangSmith tracing is disabled because required configuration is missing")
        return NoOpObserver()

    if run_factory is None:
        try:
            from langsmith import Client
            from langsmith.run_trees import RunTree

            client = Client(
                api_key=settings.langsmith_api_key,
                api_url=settings.langsmith_endpoint,
                omit_traced_runtime_info=True,
            )
        except Exception:
            _warn(logger, "LangSmith tracing operation failed")
            return NoOpObserver()

        def create_run(**payload):
            return RunTree(
                **payload,
                project_name=settings.langsmith_project,
                ls_client=client,
            )

        run_factory = create_run

    return _LangSmithObserver(
        run_factory,
        settings.langsmith_hash_salt,
        logger,
        settings.langsmith_capture_content,
    )
