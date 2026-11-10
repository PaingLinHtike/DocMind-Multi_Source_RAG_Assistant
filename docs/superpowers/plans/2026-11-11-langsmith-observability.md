# LangSmith Observability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add privacy-preserving LangSmith traces to DocMind's existing retrieval and DeepSeek answer pipeline without adopting LangChain or allowing observability failures to affect answers.

**Architecture:** A small observability adapter owns LangSmith `RunTree` creation, metadata allowlisting, HMAC correlation, and no-op/fail-open behavior. `GenerationService` creates an `rag.answer` parent trace with retrieval, prompt, and DeepSeek child spans, while the API supplies correlation context through existing dependency construction.

**Tech Stack:** Python 3.13, FastAPI, LangSmith Python SDK, httpx, pytest

**Spec:** `docs/superpowers/specs/2026-11-11-langsmith-observability-design.md`

## Global Constraints

- Keep the current custom `httpx` DeepSeek client; do not add LangChain generation wrappers.
- `LANGSMITH_TRACING=false` remains the default.
- Never send questions, prompts, answers, document chunks, vectors, API keys, authorization headers, raw provider responses, or raw application IDs to LangSmith.
- HMAC correlation uses a dedicated `LANGSMITH_HASH_SALT`; never reuse `RAG_INTERNAL_TOKEN` or another credential.
- LangSmith setup, transport, start, update, and end failures must not change retrieval, generation, or HTTP response behavior.
- Do not commit any real LangSmith or DeepSeek credential. The credentials shared in chat must be revoked and replaced before tracing is enabled.
- Tests must use fake/in-memory tracing dependencies and must not call LangSmith, DeepSeek, or any external network.

## Review Focus

- Invalid `LANGSMITH_TRACING` values must fail closed to disabled tracing; Task 1 pins this with configuration tests.
- Tracing enabled with a missing API key or hash salt must select the no-op observer and emit only a sanitized warning; Task 1 pins this with factory tests.
- Questions, chunks, prompts, answers, raw IDs, authorization values, and key-shaped strings must be absent from serialized run payloads; Task 1 pins this with an adversarial sanitization test.
- Exceptions from trace start, child creation, update, or end must not alter successful, insufficient-evidence, or provider-error behavior; Tasks 1 and 2 pin this with failure-isolation tests.
- Every started span must end exactly once with a bounded status category on success, insufficient evidence, and DeepSeek failure; Task 2 pins this with hierarchy tests.

---

### Task 1: Configuration and privacy-safe LangSmith adapter

**Files:**
- Modify: `requirements.txt`
- Modify: `RAG_PRODUCTION_SYSTEM/pyproject.toml`
- Create: `RAG_PRODUCTION_SYSTEM/uv.lock`
- Modify: `RAG_PRODUCTION_SYSTEM/src/config.py`
- Create: `RAG_PRODUCTION_SYSTEM/src/observability/__init__.py`
- Create: `RAG_PRODUCTION_SYSTEM/src/observability/langsmith.py`
- Create: `RAG_PRODUCTION_SYSTEM/tests/observability/test_langsmith.py`
- Modify: `RAG_PRODUCTION_SYSTEM/tests/test_api_health.py`

**Interfaces:**
- Consumes: environment values loaded by `RAG_PRODUCTION_SYSTEM.src.config.get_settings()`.
- Produces: `TraceContext(user_id: str, conversation_id: str, message_id: str)`, `Observer.start_run(name: str, *, run_type: str, metadata: Mapping[str, TraceValue], context: TraceContext | None = None) -> TraceRun`, `TraceRun.start_child(...) -> TraceRun`, `TraceRun.end(*, outputs: Mapping[str, TraceValue] | None = None, error_category: str | None = None) -> None`, and `build_observer(settings: Settings, *, run_factory: Callable | None = None, warning_logger: Callable[[str], None] | None = None) -> Observer`.
- `TraceValue` is limited to `str | int | float | bool | None`; adapter methods reject/drop nested content rather than serializing arbitrary objects.
- `NoOpObserver` and its runs implement the same interface and never perform network calls.

- [ ] **Step 1: Write failing configuration tests**

Add tests asserting:

```python
def test_langsmith_settings_default_to_disabled(monkeypatch):
    # clear all LANGSMITH_* variables
    assert settings.langsmith_tracing is False
    assert settings.langsmith_project == "docmind-rag"
    assert settings.langsmith_endpoint == "https://api.smith.langchain.com"


def test_invalid_langsmith_tracing_value_fails_closed(monkeypatch):
    monkeypatch.setenv("LANGSMITH_TRACING", "sometimes")
    assert get_settings().langsmith_tracing is False
```

- [ ] **Step 2: Run configuration tests and verify RED**

Run: `python -m pytest RAG_PRODUCTION_SYSTEM/tests/test_api_health.py -q`

Expected: FAIL because the `Settings` LangSmith fields do not exist.

- [ ] **Step 3: Add settings and explicit dependency**

Add `langsmith` explicitly to `requirements.txt` and run `uv add langsmith --project RAG_PRODUCTION_SYSTEM` so `pyproject.toml` and `uv.lock` describe the same direct dependency for the new uv workflow. In `config.py`, add `langsmith_tracing: bool`, `langsmith_api_key: str`, `langsmith_project: str`, `langsmith_endpoint: str`, and `langsmith_hash_salt: str`. Add `_env_bool(name: str, default: bool = False) -> bool` accepting only `1/true/yes/on` and `0/false/no/off`; unknown values return the default.

- [ ] **Step 4: Run configuration tests and verify GREEN**

Run: `python -m pytest RAG_PRODUCTION_SYSTEM/tests/test_api_health.py -q`

Expected: all tests pass.

- [ ] **Step 5: Write failing adapter tests**

Create tests that assert:

```python
def test_disabled_observer_is_noop_and_never_calls_factory(): ...
def test_enabled_observer_without_key_or_hash_salt_falls_back_with_sanitized_warning(): ...
def test_enabled_observer_hmac_hashes_ids_and_sends_only_allowlisted_scalar_metadata(): ...
def test_trace_payload_excludes_content_secrets_headers_and_raw_ids(): ...
def test_run_factory_and_end_failures_are_suppressed(): ...
def test_end_is_idempotent(): ...
```

Use a recording `run_factory` whose captured input is serialized and checked against sentinel values for question text, prompt text, answer text, document text, raw IDs, `Bearer`, and key-shaped strings.

- [ ] **Step 6: Run adapter tests and verify RED**

Run: `python -m pytest RAG_PRODUCTION_SYSTEM/tests/observability/test_langsmith.py -q`

Expected: FAIL because the observability module does not exist.

- [ ] **Step 7: Implement the adapter**

Implement the interfaces above in `src/observability/langsmith.py`. Use the stable installed LangSmith SDK `RunTree`/client API behind the injected `run_factory`; always create runs with empty `inputs`, scalar allowlisted metadata, and summarized scalar `outputs`. HMAC identifiers with SHA-256 and the dedicated salt. Wrap every SDK interaction in fail-open guards that call `warning_logger("LangSmith tracing operation failed")` without exception text or payload data.

- [ ] **Step 8: Run adapter tests and full Python tests**

Run: `python -m pytest RAG_PRODUCTION_SYSTEM/tests/observability/test_langsmith.py RAG_PRODUCTION_SYSTEM/tests -q`

Expected: all tests pass with no external requests.

- [ ] **Step 9: Commit**

```bash
git add requirements.txt RAG_PRODUCTION_SYSTEM/pyproject.toml RAG_PRODUCTION_SYSTEM/uv.lock RAG_PRODUCTION_SYSTEM/src/config.py RAG_PRODUCTION_SYSTEM/src/observability RAG_PRODUCTION_SYSTEM/tests/observability RAG_PRODUCTION_SYSTEM/tests/test_api_health.py
git commit -m "feat(observability): add privacy-safe LangSmith adapter"
```

---

### Task 2: Trace retrieval and DeepSeek answer generation

**Files:**
- Modify: `RAG_PRODUCTION_SYSTEM/src/generation/service.py`
- Modify: `RAG_PRODUCTION_SYSTEM/tests/generation/test_generation_service.py`

**Interfaces:**
- Consumes: Task 1's `Observer`, `TraceRun`, and `TraceContext` interfaces.
- Produces: `GenerationService.__init__(retriever, llm_client, context_token_budget: int = 6000, observer: Observer | None = None)` and `GenerationService.answer(question: str, user_id: str, document_ids: Sequence[str] | None = None, trace_context: TraceContext | None = None) -> AnswerResult`.
- Existing callers remain valid because observer and trace context are optional and default to no-op behavior.

- [ ] **Step 1: Expand the generation-service fakes and write failing hierarchy tests**

Add recording fakes and tests asserting:

```python
def test_success_records_answer_retrieve_prompt_and_deepseek_hierarchy_without_content(): ...
def test_insufficient_evidence_ends_parent_and_prompt_once_without_deepseek_span(): ...
def test_provider_failure_ends_deepseek_and_parent_with_provider_error_then_reraises(): ...
def test_broken_observer_does_not_change_successful_answer(): ...
```

For success, assert span names exactly `rag.answer`, `rag.retrieve`, `rag.prompt`, and `rag.deepseek`; assert outputs contain only counts/status; assert sensitive sentinel strings are absent from the fake observer's serialized records.

- [ ] **Step 2: Run generation-service tests and verify RED**

Run: `python -m pytest RAG_PRODUCTION_SYSTEM/tests/generation/test_generation_service.py -q`

Expected: FAIL because `GenerationService` does not accept observer/context and creates no spans.

- [ ] **Step 3: Add trace lifecycle to `GenerationService`**

Wrap the existing flow with the Task 1 interface. Record only these bounded values:

- Parent metadata: `document_scope_count`, `context_token_budget`; outputs: `status`, `citation_count`.
- Retrieval metadata/outputs: `document_scope_count`, `retrieved_chunk_count`.
- Prompt metadata/outputs: `context_token_budget`, `context_chunk_count`, `status`.
- DeepSeek metadata/outputs: `model`, `status`, `used_citation_count`.
- Error categories: `provider_error` or `pipeline_error`; never exception messages.

Preserve the current insufficient-evidence answer and exception semantics exactly.

- [ ] **Step 4: Run generation-service and full Python tests**

Run: `python -m pytest RAG_PRODUCTION_SYSTEM/tests/generation/test_generation_service.py RAG_PRODUCTION_SYSTEM/tests -q`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add RAG_PRODUCTION_SYSTEM/src/generation/service.py RAG_PRODUCTION_SYSTEM/tests/generation/test_generation_service.py
git commit -m "feat(observability): trace RAG answer stages"
```

---

### Task 3: Wire request correlation, document configuration, and verify production behavior

**Files:**
- Modify: `RAG_PRODUCTION_SYSTEM/src/api/generation.py`
- Modify: `RAG_PRODUCTION_SYSTEM/tests/api/test_generation_api.py`
- Modify: `RAG_PRODUCTION_SYSTEM/.env.example`
- Modify: `RAG_PRODUCTION_SYSTEM/README.md`

**Interfaces:**
- Consumes: Task 1's `build_observer(settings)` and `TraceContext`; Task 2's optional `observer` and `trace_context` parameters.
- Produces: FastAPI dependency construction that creates one configured observer and passes a `TraceContext` built from the trusted request fields into `GenerationService.answer(...)`.

- [ ] **Step 1: Write failing API wiring tests**

Update the fake service to record call arguments and add tests asserting:

```python
def test_answer_passes_trace_context_without_changing_response_contract():
    assert service.trace_context.user_id == "u"
    assert service.trace_context.conversation_id == "c"
    assert service.trace_context.message_id == "m"
    assert response.json() == {"answer": "Grounded [1]", "citations": []}


def test_answer_failure_response_remains_sanitized_when_tracing_is_enabled(): ...
```

- [ ] **Step 2: Run API tests and verify RED**

Run: `python -m pytest RAG_PRODUCTION_SYSTEM/tests/api/test_generation_api.py -q`

Expected: FAIL because the API does not build/pass `TraceContext` and the service factory has no observer.

- [ ] **Step 3: Wire the observer and trace context**

In `get_generation_service()`, call `build_observer(settings)` and pass it into `GenerationService`. In `answer()`, construct `TraceContext` from `user_id`, `conversation_id`, and `message_id`, and pass it to `service.answer(...)`. Do not alter the public response body or sanitized HTTP 503 behavior.

- [ ] **Step 4: Run API tests and verify GREEN**

Run: `python -m pytest RAG_PRODUCTION_SYSTEM/tests/api/test_generation_api.py -q`

Expected: all tests pass.

- [ ] **Step 5: Add safe environment examples and operations documentation**

Add empty/default LangSmith variables to `.env.example`; never add real keys. Document key rotation, metadata-only capture, project naming, disabled-by-default behavior, enabling steps, and the fact that LangSmith outages do not fail requests. Include a smoke-check that uses a synthetic question/document only and tells operators to verify no content appears in the LangSmith run.

- [ ] **Step 6: Run complete verification**

Run:

```bash
python -m pytest RAG_PRODUCTION_SYSTEM/tests -q
php backend/artisan test --compact
npm --prefix frontend test -- --run
npm --prefix frontend run lint
npm --prefix frontend run build
git diff --check
```

Expected: Python, Laravel, and React tests pass; lint and build succeed; `git diff --check` reports no errors.

- [ ] **Step 7: Inspect the final diff for secret/content leakage**

Run searches for the revoked key prefixes, `LANGSMITH_API_KEY=` with a non-empty value, and sensitive fixture strings. Expected: no real credential and no production trace payload containing raw question, prompt, answer, chunk, header, or ID fields.

- [ ] **Step 8: Commit**

```bash
git add RAG_PRODUCTION_SYSTEM/src/api/generation.py RAG_PRODUCTION_SYSTEM/tests/api/test_generation_api.py RAG_PRODUCTION_SYSTEM/.env.example RAG_PRODUCTION_SYSTEM/README.md
git commit -m "docs(observability): configure LangSmith tracing"
```
