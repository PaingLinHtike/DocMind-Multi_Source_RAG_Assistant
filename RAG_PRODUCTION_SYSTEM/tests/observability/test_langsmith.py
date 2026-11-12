import json

import langsmith
import pytest

from RAG_PRODUCTION_SYSTEM.src.config import Settings
from RAG_PRODUCTION_SYSTEM.src.observability import TokenUsage
from RAG_PRODUCTION_SYSTEM.src.observability.langsmith import TraceContext, build_observer


class RecordingRun:
    def __init__(self, records, **payload):
        self.records = records
        self.payload = payload
        self.post_count = 0
        self.patch_count = 0
        self.set_payloads = []
        self.records.append(self)

    def post(self):
        self.post_count += 1

    def create_child(self, **payload):
        return RecordingRun(self.records, **payload)

    def end(self, **payload):
        self.payload["end"] = payload

    def set(self, **payload):
        self.set_payloads.append(payload)

    def patch(self):
        self.patch_count += 1


def enabled_settings(**overrides):
    values = {
        "langsmith_tracing": True,
        "langsmith_api_key": "test-api-key",
        "langsmith_project": "docmind-rag",
        "langsmith_endpoint": "https://example.invalid",
        "langsmith_hash_salt": "dedicated-test-salt",
    }
    values.update(overrides)
    return Settings(**values)


def test_disabled_observer_is_noop_and_never_calls_factory():
    calls = []
    observer = build_observer(Settings(), run_factory=lambda **payload: calls.append(payload))

    run = observer.start_run("rag.answer", run_type="chain", metadata={"status": "started"})
    run.end(outputs={"status": "completed"})

    assert calls == []


def test_enabled_observer_without_key_or_hash_salt_falls_back_with_sanitized_warning():
    warnings = []
    calls = []
    observer = build_observer(
        enabled_settings(langsmith_api_key="", langsmith_hash_salt=""),
        run_factory=lambda **payload: calls.append(payload),
        warning_logger=warnings.append,
    )

    observer.start_run("rag.answer", run_type="chain", metadata={})

    assert calls == []
    assert warnings == ["LangSmith tracing is disabled because required configuration is missing"]


def test_enabled_observer_hmac_hashes_ids_and_sends_only_allowlisted_scalar_metadata():
    records = []
    observer = build_observer(
        enabled_settings(),
        run_factory=lambda **payload: RecordingRun(records, **payload),
    )
    context = TraceContext("user-raw", "conversation-raw", "message-raw")

    run = observer.start_run(
        "rag.answer",
        run_type="chain",
        context=context,
        inputs={"question": "private question"},
        metadata={"document_scope_count": 2, "nested": {"private": "value"}},
    )
    run.end(outputs={"status": "completed", "citation_count": 1, "answer": "private answer"})

    metadata = records[0].payload["extra"]["metadata"]
    assert metadata["document_scope_count"] == 2
    assert "nested" not in metadata
    assert metadata["user_hash"] != "user-raw"
    assert len(metadata["user_hash"]) == 64
    assert len(metadata["conversation_hash"]) == 64
    assert len(metadata["message_hash"]) == 64
    assert records[0].payload["inputs"] == {}
    assert records[0].payload["end"]["outputs"] == {"status": "completed", "citation_count": 1}


def test_content_capture_allows_only_root_question_and_answer():
    records = []
    observer = build_observer(
        enabled_settings(langsmith_capture_content=True),
        run_factory=lambda **payload: RecordingRun(records, **payload),
    )

    run = observer.start_run(
        "rag.answer",
        run_type="chain",
        metadata={"status": "started"},
        inputs={"question": "What is the policy?", "prompt": "private prompt"},
    )
    run.end(outputs={
        "status": "completed",
        "citation_count": 1,
        "answer": "The policy allows it.",
        "provider_body": "private provider body",
    })

    assert records[0].payload["inputs"] == {"question": "What is the policy?"}
    assert records[0].payload["end"]["outputs"] == {
        "status": "completed",
        "citation_count": 1,
        "answer": "The policy allows it.",
    }


def test_content_capture_never_allows_content_on_child_runs():
    records = []
    observer = build_observer(
        enabled_settings(langsmith_capture_content=True),
        run_factory=lambda **payload: RecordingRun(records, **payload),
    )
    parent = observer.start_run(
        "rag.answer",
        run_type="chain",
        metadata={},
        inputs={"question": "Root question"},
    )

    child = parent.start_child("rag.deepseek", run_type="chain", metadata={"model": "deepseek-chat"})
    child.end(outputs={"status": "completed", "answer": "private child answer"})

    assert records[1].payload["inputs"] == {}
    assert records[1].payload["end"]["outputs"] == {"status": "completed"}


@pytest.mark.parametrize("capture_content", [False, True])
def test_llm_run_sets_exact_usage_metadata_before_patch(capture_content):
    records = []
    observer = build_observer(
        enabled_settings(langsmith_capture_content=capture_content),
        run_factory=lambda **payload: RecordingRun(records, **payload),
    )
    parent = observer.start_run(
        "rag.answer",
        run_type="chain",
        metadata={},
        inputs={"question": "private question"},
    )

    child = parent.start_child("rag.deepseek", run_type="llm", metadata={"model": "deepseek-chat"})
    child.end(
        outputs={"status": "completed", "used_citation_count": 1, "answer": "private child answer"},
        usage=TokenUsage(101, 23, 124),
    )

    assert records[1].set_payloads == [{
        "usage_metadata": {"input_tokens": 101, "output_tokens": 23, "total_tokens": 124},
    }]
    assert records[1].payload["inputs"] == {}
    assert records[1].payload["end"]["outputs"] == {"status": "completed", "used_citation_count": 1}


def test_usage_metadata_failure_still_ends_and_patches_run():
    warnings = []
    records = []

    class BrokenUsageRun(RecordingRun):
        def set(self, **payload):
            raise RuntimeError("private usage failure")

    observer = build_observer(
        enabled_settings(),
        run_factory=lambda **payload: BrokenUsageRun(records, **payload),
        warning_logger=warnings.append,
    )
    run = observer.start_run("rag.deepseek", run_type="llm", metadata={"model": "deepseek-chat"})

    run.end(outputs={"status": "completed"}, usage=TokenUsage(101, 23, 124))

    assert records[0].payload["end"]["outputs"] == {"status": "completed"}
    assert records[0].patch_count == 1
    assert warnings == ["LangSmith tracing operation failed"]


def test_content_capture_is_restricted_to_the_named_rag_answer_root():
    records = []
    observer = build_observer(
        enabled_settings(langsmith_capture_content=True),
        run_factory=lambda **payload: RecordingRun(records, **payload),
    )

    run = observer.start_run(
        "maintenance.probe",
        run_type="chain",
        metadata={},
        inputs={"question": "private question"},
    )
    run.end(outputs={"status": "completed", "answer": "private answer"})

    assert records[0].payload["inputs"] == {}
    assert records[0].payload["end"]["outputs"] == {"status": "completed"}


def test_trace_payload_excludes_content_secrets_headers_and_raw_ids():
    records = []
    observer = build_observer(
        enabled_settings(),
        run_factory=lambda **payload: RecordingRun(records, **payload),
    )
    sentinels = [
        "private question",
        "private prompt",
        "private answer",
        "private document chunk",
        "raw-user-id",
        "Bearer private-token",
        "sk-private-key",
    ]

    run = observer.start_run(
        "rag.answer",
        run_type="chain",
        context=TraceContext("raw-user-id", "raw-conversation-id", "raw-message-id"),
        metadata={
            "question": sentinels[0],
            "prompt": sentinels[1],
            "answer": sentinels[2],
            "chunk": sentinels[3],
            "authorization": sentinels[5],
            "api_key": sentinels[6],
            "document_scope_count": 1,
        },
    )
    run.end(outputs={"status": "completed", "answer": sentinels[2]})

    serialized = json.dumps([record.payload for record in records])
    for sentinel in sentinels:
        assert sentinel not in serialized


def test_run_factory_and_end_failures_are_suppressed():
    warnings = []

    def broken_factory(**payload):
        raise RuntimeError("secret transport failure")

    observer = build_observer(enabled_settings(), run_factory=broken_factory, warning_logger=warnings.append)
    run = observer.start_run("rag.answer", run_type="chain", metadata={})
    run.end(outputs={"status": "completed"})

    assert warnings == ["LangSmith tracing operation failed"]


def test_client_setup_failure_falls_back_to_noop(monkeypatch):
    warnings = []

    def broken_client(**kwargs):
        raise RuntimeError("secret setup failure")

    monkeypatch.setattr(langsmith, "Client", broken_client)

    observer = build_observer(enabled_settings(), warning_logger=warnings.append)
    observer.start_run("rag.answer", run_type="chain", metadata={})

    assert warnings == ["LangSmith tracing operation failed"]


def test_client_disables_automatic_runtime_metadata(monkeypatch):
    captured = {}

    class RecordingClient:
        def __init__(self, **kwargs):
            captured.update(kwargs)

    monkeypatch.setattr(langsmith, "Client", RecordingClient)

    build_observer(enabled_settings())

    assert captured["omit_traced_runtime_info"] is True


def test_end_is_idempotent():
    records = []
    observer = build_observer(
        enabled_settings(),
        run_factory=lambda **payload: RecordingRun(records, **payload),
    )
    run = observer.start_run("rag.answer", run_type="chain", metadata={})

    run.end(outputs={"status": "completed"})
    run.end(outputs={"status": "completed"})

    assert records[0].patch_count == 1
