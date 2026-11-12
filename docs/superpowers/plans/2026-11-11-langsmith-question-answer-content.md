# LangSmith Question and Answer Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an explicit, default-off LangSmith option that displays the RAG question and final answer only on the root `rag.answer` trace.

**Architecture:** Configuration and the generation service provide the first privacy gate, so content never enters the tracing abstraction unless capture is enabled. The LangSmith observer provides a second allowlist gate: only root `question` input and root `answer` output are accepted, while every child run remains metadata-only.

**Tech Stack:** Python 3, FastAPI, LangSmith SDK, pytest

**Spec:** `docs/superpowers/specs/2026-11-11-langsmith-question-answer-content-design.md`

## Global Constraints

- `LANGSMITH_CAPTURE_CONTENT` defaults to `false`; invalid values fail closed.
- Never trace retrieved chunks, prompts, credentials, raw IDs, headers, or provider response bodies.
- Child runs remain content-free even when root content capture is enabled.
- Tracing failures remain fail-open and cannot change answer generation.
- Do not add dependencies.

## Review Focus

- Missing or invalid capture flag must produce metadata-only traces.
- An insufficient-evidence response must expose only its final answer when opted in, never retrieved content.
- Child runs must reject attempted `question` or `answer` content even when root capture is enabled.
- Provider and observer failures must not leak exception details or alter API behavior.
- Empty question/answer values must not broaden the content allowlist or enable arbitrary keys.

---

### Task 1: Parse the opt-in setting

**Files:**
- Modify: `RAG_PRODUCTION_SYSTEM/src/config.py`
- Modify: `RAG_PRODUCTION_SYSTEM/tests/test_api_health.py`
- Modify: `RAG_PRODUCTION_SYSTEM/.env.example`

**Interfaces:**
- Produces: `Settings.langsmith_capture_content: bool`, populated from `LANGSMITH_CAPTURE_CONTENT` through the existing `_env_bool` parser.

- [ ] **Step 1: Write failing configuration tests**

Add tests asserting the setting is `False` when absent, `True` for `LANGSMITH_CAPTURE_CONTENT=true`, and `False` for an invalid value.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `.venv/Scripts/python.exe -m pytest RAG_PRODUCTION_SYSTEM/tests/test_api_health.py -q`

Expected: FAIL because `Settings` has no `langsmith_capture_content` field.

- [ ] **Step 3: Implement the setting and committed default**

Add `langsmith_capture_content: bool = False` and load it with `_env_bool("LANGSMITH_CAPTURE_CONTENT")`. Add `LANGSMITH_CAPTURE_CONTENT=false` to `.env.example`.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `.venv/Scripts/python.exe -m pytest RAG_PRODUCTION_SYSTEM/tests/test_api_health.py -q`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add RAG_PRODUCTION_SYSTEM/src/config.py RAG_PRODUCTION_SYSTEM/tests/test_api_health.py RAG_PRODUCTION_SYSTEM/.env.example
git commit -m "feat(observability): add trace content opt-in"
```

### Task 2: Enforce root-only content in the LangSmith adapter

**Files:**
- Modify: `RAG_PRODUCTION_SYSTEM/src/observability/langsmith.py`
- Modify: `RAG_PRODUCTION_SYSTEM/tests/observability/test_langsmith.py`

**Interfaces:**
- Consumes: `Settings.langsmith_capture_content: bool` from Task 1.
- Produces: `Observer.start_run(..., inputs: Mapping[str, TraceValue] | None = None) -> TraceRun`.
- Produces: root `TraceRun.end(outputs=...)` support for allowlisted `answer` content only when opted in.

- [ ] **Step 1: Write failing adapter tests**

Add tests proving: default capture sends `{}` inputs and strips `answer`; opted-in capture sends only `question` and `answer`; arbitrary input/output keys are dropped; a child created from an opted-in root still strips all content keys.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `.venv/Scripts/python.exe -m pytest RAG_PRODUCTION_SYSTEM/tests/observability/test_langsmith.py -q`

Expected: FAIL because `start_run` does not accept inputs and content is always excluded.

- [ ] **Step 3: Implement independent allowlist gates**

Extend the observer protocol and implementations with optional inputs. Pass the capture flag into `_LangSmithObserver`; create root `_LangSmithRun` instances with content permission and all child `_LangSmithRun` instances without it. Allow only `question` in root inputs and `answer` in root outputs when permission is true; retain existing metadata/output allowlists.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `.venv/Scripts/python.exe -m pytest RAG_PRODUCTION_SYSTEM/tests/observability/test_langsmith.py -q`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add RAG_PRODUCTION_SYSTEM/src/observability/langsmith.py RAG_PRODUCTION_SYSTEM/tests/observability/test_langsmith.py
git commit -m "feat(observability): allow root question and answer traces"
```

### Task 3: Supply content from the generation pipeline only when enabled

**Files:**
- Modify: `RAG_PRODUCTION_SYSTEM/src/generation/service.py`
- Modify: `RAG_PRODUCTION_SYSTEM/src/api/generation.py`
- Modify: `RAG_PRODUCTION_SYSTEM/tests/generation/test_generation_service.py`
- Modify: `RAG_PRODUCTION_SYSTEM/tests/api/test_generation_api.py`

**Interfaces:**
- Consumes: observer `start_run(..., inputs=...)` from Task 2.
- Produces: `GenerationService(..., capture_trace_content: bool = False)`.

- [ ] **Step 1: Write failing pipeline tests**

Add tests asserting metadata-only behavior remains the default; capture mode records the root question and successful answer; insufficient-evidence mode records its deterministic final answer; child records contain no question, answer, chunk, or prompt content; API construction passes `settings.langsmith_capture_content` into the service.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `.venv/Scripts/python.exe -m pytest RAG_PRODUCTION_SYSTEM/tests/generation/test_generation_service.py RAG_PRODUCTION_SYSTEM/tests/api/test_generation_api.py -q`

Expected: FAIL because `GenerationService` has no capture option and never supplies root content.

- [ ] **Step 3: Implement the generation-service gate**

Add `capture_trace_content: bool = False`. When true, start the root with `inputs={"question": question}` and include `answer` in successful and insufficient-evidence root outputs. Keep child calls unchanged. Wire the setting in `get_generation_service()`.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `.venv/Scripts/python.exe -m pytest RAG_PRODUCTION_SYSTEM/tests/generation/test_generation_service.py RAG_PRODUCTION_SYSTEM/tests/api/test_generation_api.py -q`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add RAG_PRODUCTION_SYSTEM/src/generation/service.py RAG_PRODUCTION_SYSTEM/src/api/generation.py RAG_PRODUCTION_SYSTEM/tests/generation/test_generation_service.py RAG_PRODUCTION_SYSTEM/tests/api/test_generation_api.py
git commit -m "feat(observability): trace opted-in questions and answers"
```

### Task 4: Document, enable locally, and verify

**Files:**
- Modify: `RAG_PRODUCTION_SYSTEM/README.md`
- Modify locally only: `RAG_PRODUCTION_SYSTEM/.env` (ignored)

**Interfaces:**
- Consumes: `LANGSMITH_CAPTURE_CONTENT` from Task 1.

- [ ] **Step 1: Update observability documentation**

Explain that capture is default-off, includes only the root question/final answer, excludes child/document content, and should be enabled only when sending those values to LangSmith is acceptable.

- [ ] **Step 2: Enable local capture without exposing secrets**

Set `LANGSMITH_CAPTURE_CONTENT=true` in the ignored local `.env`; do not print or commit secret values.

- [ ] **Step 3: Run the complete RAG test suite**

Run: `.venv/Scripts/python.exe -m pytest RAG_PRODUCTION_SYSTEM/tests -q`

Expected: all tests PASS with no warnings containing secrets.

- [ ] **Step 4: Restart FastAPI and perform local configuration verification**

Restart Uvicorn, then verify `/health` returns HTTP 200 and a local settings check reports tracing/content capture enabled without printing credentials.

- [ ] **Step 5: Commit documentation and plan artifacts**

```bash
git add RAG_PRODUCTION_SYSTEM/README.md docs/superpowers/specs/2026-11-11-langsmith-question-answer-content-design.md docs/superpowers/plans/2026-11-11-langsmith-question-answer-content.md
git commit -m "docs(observability): describe trace content controls"
```
