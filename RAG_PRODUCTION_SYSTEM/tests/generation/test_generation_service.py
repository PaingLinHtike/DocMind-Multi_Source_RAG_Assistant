import asyncio
import json

import pytest

from RAG_PRODUCTION_SYSTEM.src.generation.llm_client import LlmResponseError
from RAG_PRODUCTION_SYSTEM.src.generation.models import GeneratedAnswer
from RAG_PRODUCTION_SYSTEM.src.generation.service import GenerationService
from RAG_PRODUCTION_SYSTEM.src.observability.langsmith import TraceContext
from RAG_PRODUCTION_SYSTEM.src.retrieval.models import RetrievedChunk


class EmptyRetriever:
    def search(self, *args, **kwargs):
        return []


class EvidenceRetriever:
    def search(self, *args, **kwargs):
        return [RetrievedChunk("private document chunk", 0.9, "doc-raw", "private.txt", 2, "chunk-raw")]


class FailingClient:
    model = "deepseek-chat"

    async def generate(self, prompt):
        raise AssertionError("should not call LLM")


class SuccessfulClient:
    model = "deepseek-chat"

    async def generate(self, prompt):
        return GeneratedAnswer("private answer [1]", (1,))


class ProviderFailureClient:
    model = "deepseek-chat"

    async def generate(self, prompt):
        raise LlmResponseError("private provider detail")


class RecordingRun:
    def __init__(self, name, records, metadata, parent=None):
        self.name = name
        self.records = records
        self.metadata = dict(metadata)
        self.parent = parent
        self.outputs = None
        self.error_category = None
        self.end_count = 0
        records.append(self)

    def start_child(self, name, *, run_type, metadata):
        return RecordingRun(name, self.records, metadata, self.name)

    def end(self, *, outputs=None, error_category=None):
        self.end_count += 1
        self.outputs = dict(outputs or {})
        self.error_category = error_category


class RecordingObserver:
    def __init__(self):
        self.records = []

    def start_run(self, name, *, run_type, metadata, context=None):
        return RecordingRun(name, self.records, metadata)


class BrokenObserver:
    def start_run(self, *args, **kwargs):
        raise RuntimeError("private tracing failure")


def run_answer(service):
    return asyncio.run(service.answer(
        "private question",
        "user-raw",
        ["doc-raw"],
        TraceContext("user-raw", "conversation-raw", "message-raw"),
    ))


def test_no_evidence_returns_deterministic_answer_without_llm():
    result = asyncio.run(GenerationService(EmptyRetriever(), FailingClient()).answer("question", "u1"))
    assert "enough information" in result.answer
    assert result.citations == []


def test_success_records_answer_retrieve_prompt_and_deepseek_hierarchy_without_content():
    observer = RecordingObserver()
    result = run_answer(GenerationService(EvidenceRetriever(), SuccessfulClient(), observer=observer))

    assert result.answer == "private answer [1]"
    assert [(run.name, run.parent) for run in observer.records] == [
        ("rag.answer", None),
        ("rag.retrieve", "rag.answer"),
        ("rag.prompt", "rag.answer"),
        ("rag.deepseek", "rag.answer"),
    ]
    assert observer.records[0].outputs == {"status": "completed", "citation_count": 1}
    assert observer.records[1].outputs == {"retrieved_chunk_count": 1}
    assert observer.records[2].outputs == {"status": "completed", "context_chunk_count": 1}
    assert observer.records[3].outputs == {"status": "completed", "used_citation_count": 1}
    serialized = json.dumps([
        {"metadata": run.metadata, "outputs": run.outputs, "error": run.error_category}
        for run in observer.records
    ])
    for sentinel in ("private question", "private document chunk", "private answer", "user-raw", "doc-raw"):
        assert sentinel not in serialized


def test_insufficient_evidence_ends_parent_and_prompt_once_without_deepseek_span():
    observer = RecordingObserver()
    result = run_answer(GenerationService(EmptyRetriever(), FailingClient(), observer=observer))

    assert "enough information" in result.answer
    assert [run.name for run in observer.records] == ["rag.answer", "rag.retrieve", "rag.prompt"]
    assert observer.records[0].outputs == {"status": "insufficient_evidence", "citation_count": 0}
    assert observer.records[2].outputs == {"status": "insufficient_evidence", "context_chunk_count": 0}
    assert all(run.end_count == 1 for run in observer.records)


def test_provider_failure_ends_deepseek_and_parent_with_provider_error_then_reraises():
    observer = RecordingObserver()
    service = GenerationService(EvidenceRetriever(), ProviderFailureClient(), observer=observer)

    with pytest.raises(LlmResponseError):
        run_answer(service)

    assert observer.records[-1].name == "rag.deepseek"
    assert observer.records[-1].error_category == "provider_error"
    assert observer.records[0].error_category == "provider_error"
    assert all(run.end_count == 1 for run in observer.records)


def test_broken_observer_does_not_change_successful_answer():
    result = run_answer(GenerationService(EvidenceRetriever(), SuccessfulClient(), observer=BrokenObserver()))

    assert result.answer == "private answer [1]"
    assert len(result.citations) == 1
