# LangSmith DeepSeek Token Usage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Populate LangSmith's project-level token totals with actual token counts returned by successful DeepSeek Chat Completions requests.

**Architecture:** Parse optional provider usage at the DeepSeek response boundary into a provider-neutral `TokenUsage` value. Carry that value with `GeneratedAnswer`, then end the `rag.deepseek` LLM run with LangSmith-recognized `usage_metadata`; usage parsing and tracing remain fail-open and content-independent.

**Tech Stack:** Python 3.13, FastAPI, `httpx`, native `langsmith` SDK 0.14.17, pytest

**Spec:** `docs/superpowers/specs/2026-11-12-langsmith-deepseek-token-usage-design.md`

## Global Constraints

- Use actual DeepSeek `prompt_tokens`, `completion_tokens`, and `total_tokens`; do not use the Notion example's `words × 1.3` estimate.
- Do not replace the existing context selection, add a tokenizer, calculate cost, or migrate generation to LangChain.
- Missing, malformed, or untraceable usage must never change the generated answer, citations, exception semantics, or HTTP response.
- Token telemetry contains non-negative integer counts only; never add prompts, answers, provider bodies, credentials, headers, or exception details.
- `LANGSMITH_CAPTURE_CONTENT` remains independent from token reporting.

## Review Focus

- A successful DeepSeek response with no `usage` object still returns its answer and citations with `usage=None`; Task 1 pins this.
- Malformed counts, including booleans, strings, negative values, or partial usage, are ignored as a unit rather than failing generation or recording misleading partial totals; Task 1 pins this.
- A LangSmith `set(usage_metadata=...)` failure emits only the sanitized warning, still ends/patches the run, and does not alter the answer; Task 2 pins this.
- Usage reporting works with content capture both disabled and enabled without adding prompt, answer, or provider-body fields to the `rag.deepseek` child; Task 2 pins this.
- Insufficient-evidence and provider-error paths do not fabricate token usage, while successful very large integer counts pass through unchanged; Tasks 1 and 2 pin these boundaries.

---

### Task 1: Parse actual DeepSeek usage without affecting generation

**Files:**
- Create: `RAG_PRODUCTION_SYSTEM/src/observability/models.py`
- Modify: `RAG_PRODUCTION_SYSTEM/src/observability/__init__.py`
- Modify: `RAG_PRODUCTION_SYSTEM/src/generation/models.py`
- Modify: `RAG_PRODUCTION_SYSTEM/src/generation/llm_client.py`
- Modify: `RAG_PRODUCTION_SYSTEM/tests/generation/test_deepseek_client.py`

**Interfaces:**
- Consumes: DeepSeek Chat Completions JSON with `choices[0].message.content` and optional `usage.prompt_tokens`, `usage.completion_tokens`, `usage.total_tokens`.
- Produces: `TokenUsage(input_tokens: int, output_tokens: int, total_tokens: int)` and `GeneratedAnswer(text: str, used_citation_numbers: tuple[int, ...], usage: TokenUsage | None = None)`.

- [ ] **Step 1: Write failing valid-usage and large-count tests**

Add `test_deepseek_client_returns_actual_token_usage()` and use literal provider counts `101`, `23`, and `124`; assert `result.usage == TokenUsage(101, 23, 124)`. Add a case with integers greater than 2^31 and assert they pass through unchanged.

- [ ] **Step 2: Write failing missing and malformed usage tests**

Use table-driven response payloads for missing `usage`, partial fields, string counts, boolean counts, and negative counts. Each response must contain a valid answer; assert generation succeeds and `result.usage is None`.

Also add a direct value-object test asserting `TokenUsage` rejects booleans and negative values with `ValueError`, so invalid telemetry cannot be constructed by another caller.

- [ ] **Step 3: Run focused tests and verify RED**

Run: `python -m pytest RAG_PRODUCTION_SYSTEM/tests/generation/test_deepseek_client.py -q`

Expected: FAIL because `TokenUsage` and `GeneratedAnswer.usage` do not exist.

- [ ] **Step 4: Add the token value and optional generated-answer field**

Create the frozen dataclass `TokenUsage` in `src/observability/models.py`, validate in `__post_init__` that every field has `type(value) is int` and `value >= 0`, export it from `src/observability/__init__.py`, and add `usage: TokenUsage | None = None` to `GeneratedAnswer`. The default preserves all existing two-argument construction.

- [ ] **Step 5: Parse optional usage at the HTTP response boundary**

Add `_parse_usage(payload: object) -> TokenUsage | None` in `llm_client.py`. Accept the usage only when all three DeepSeek fields are present with `type(value) is int` and `value >= 0`; map prompt→input and completion→output. Parse `response.json()` once. Invalid usage returns `None` without entering the existing provider-error path.

- [ ] **Step 6: Run focused and generation tests and verify GREEN**

Run: `python -m pytest RAG_PRODUCTION_SYSTEM/tests/generation -q`

Expected: all generation tests pass.

- [ ] **Step 7: Commit**

```bash
git add RAG_PRODUCTION_SYSTEM/src/observability/models.py RAG_PRODUCTION_SYSTEM/src/observability/__init__.py RAG_PRODUCTION_SYSTEM/src/generation/models.py RAG_PRODUCTION_SYSTEM/src/generation/llm_client.py RAG_PRODUCTION_SYSTEM/tests/generation/test_deepseek_client.py
git commit -m "feat(generation): capture DeepSeek token usage"
```

---

### Task 2: Report actual usage to the LangSmith LLM run

**Files:**
- Modify: `RAG_PRODUCTION_SYSTEM/src/observability/langsmith.py`
- Modify: `RAG_PRODUCTION_SYSTEM/src/generation/service.py`
- Modify: `RAG_PRODUCTION_SYSTEM/tests/observability/test_langsmith.py`
- Modify: `RAG_PRODUCTION_SYSTEM/tests/generation/test_generation_service.py`
- Modify: `RAG_PRODUCTION_SYSTEM/README.md`

**Interfaces:**
- Consumes: Task 1's `TokenUsage` and `GeneratedAnswer.usage`.
- Produces: `TraceRun.end(*, outputs: Mapping[str, TraceValue] | None = None, error_category: str | None = None, usage: TokenUsage | None = None) -> None`; `GenerationService._start_child(parent, name, metadata, run_type="chain")`; `rag.deepseek` as run type `llm` with exact LangSmith `usage_metadata`.

- [ ] **Step 1: Write failing adapter usage tests**

Extend the recording SDK run with `set(**payload)`. Add `test_llm_run_sets_exact_usage_metadata_before_patch()` and assert:

```python
{"input_tokens": 101, "output_tokens": 23, "total_tokens": 124}
```

is passed under `usage_metadata`, while outputs remain the existing allowlisted status/count fields. Run the same assertion with `langsmith_capture_content=True` and verify the child still has empty inputs and no answer/provider-body output.

- [ ] **Step 2: Write failing SDK usage-update isolation test**

Add a recording run whose `set()` raises `RuntimeError("private usage failure")`. Assert `end()` and `patch()` are each still called once and the only warning is `LangSmith tracing operation failed`.

- [ ] **Step 3: Write failing generation-service usage and run-type tests**

Make `SuccessfulClient` return `GeneratedAnswer(..., usage=TokenUsage(101, 23, 124))`. Record each child's `run_type` and `usage`. Assert `rag.deepseek` is `llm`, receives exact usage once, and parent/retrieve/prompt remain `chain` without usage. Keep the existing sensitive sentinel serialization assertions.

- [ ] **Step 4: Write failing no-fabrication tests**

Assert the insufficient-evidence path creates no `rag.deepseek` run and no usage. Assert a successful client returning `usage=None` ends the LLM run normally without usage metadata. Existing provider-error behavior must remain unchanged.

- [ ] **Step 5: Run focused tests and verify RED**

Run: `python -m pytest RAG_PRODUCTION_SYSTEM/tests/observability/test_langsmith.py RAG_PRODUCTION_SYSTEM/tests/generation/test_generation_service.py -q`

Expected: FAIL because `TraceRun.end()` has no usage parameter and child creation hardcodes `chain`.

- [ ] **Step 6: Extend the trace contract and LangSmith adapter**

Add the optional `usage` parameter to the protocol, no-op run, and LangSmith run. Revalidate all three fields as exact non-negative integers at the adapter boundary, then call `self._run.set(usage_metadata={"input_tokens": ..., "output_tokens": ..., "total_tokens": ...})` before `end()`/`patch()`. Guard the usage update separately so invalid usage or an SDK failure warns safely but does not prevent the normal end/patch attempt; retain idempotency.

- [ ] **Step 7: Mark DeepSeek as an LLM run and pass usage**

Change `_start_child(..., run_type: str = "chain")` to forward the supplied type. Start only `rag.deepseek` with `run_type="llm"`, and pass `generated.usage` when ending it. Do not attach usage to the parent or other children.

- [ ] **Step 8: Document and smoke-check token totals**

Update the LangSmith section to state that successful DeepSeek calls report actual provider token counts independently of content capture. Add a smoke-check step to confirm `rag.deepseek` is an LLM run with input/output/total token usage and that the project **Total Tokens** value increases; note that insufficient-evidence runs make no LLM call and add no tokens.

- [ ] **Step 9: Run complete verification**

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

- [ ] **Step 10: Inspect the final trace payload surface**

Search production observability code and tests for `usage_metadata`, provider-body fields, prompt/answer/chunk fields, headers, and credential-shaped values. Expected: usage metadata has only the three integer counts; no new content or secret field is admitted by the adapter.

- [ ] **Step 11: Commit**

```bash
git add RAG_PRODUCTION_SYSTEM/src/observability/langsmith.py RAG_PRODUCTION_SYSTEM/src/generation/service.py RAG_PRODUCTION_SYSTEM/tests/observability/test_langsmith.py RAG_PRODUCTION_SYSTEM/tests/generation/test_generation_service.py RAG_PRODUCTION_SYSTEM/README.md
git commit -m "feat(observability): report DeepSeek token usage"
```
