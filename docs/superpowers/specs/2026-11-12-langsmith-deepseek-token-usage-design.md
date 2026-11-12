# LangSmith DeepSeek Token Usage Design

## Intent

Populate LangSmith's **Total Tokens** metric with actual token usage returned by DocMind's existing DeepSeek Chat Completions request. This follows the “Record Actual Usage” recommendation in the Notion **RAG Chatbot** page under **The 5 RAG Failure Modes → Context Overflow → Reference Code — Token Budgeting and Context Selection**.

Reference: https://app.notion.com/p/3f980eb2cdaf81bb9d4be052c1d391f6?pvs=204

## Goals

- Capture DeepSeek `usage.prompt_tokens`, `usage.completion_tokens`, and `usage.total_tokens` after a successful request.
- Send those counts to LangSmith in its recognized usage metadata shape so project-level token totals aggregate correctly.
- Identify `rag.deepseek` as an LLM run.
- Keep token reporting fail-open: absent, malformed, or untraceable usage must never change the generated answer or HTTP response.
- Preserve the existing trace-content and privacy controls. Token counts are safe scalar telemetry; prompts, answers, provider bodies, credentials, headers, and exception details remain excluded from token metadata.

## Non-goals

- Do not estimate usage with the Notion example's `words × 1.3` heuristic.
- Do not replace the current context-selection implementation or introduce a tokenizer in this change.
- Do not migrate generation to LangChain.
- Do not calculate cost or expose DeepSeek's complete response body.

## Approaches Considered

### 1. Actual provider usage — selected

Read the three standard token counts from DeepSeek's successful Chat Completions response and attach them to the `rag.deepseek` LangSmith run. This is exact for the billed request and matches the Notion recommendation to record actual usage.

### 2. Estimated prompt usage

Estimate tokens from words using a multiplier. This works without provider metrics but is model-dependent, cannot accurately count output tokens, and would make dashboard totals look more authoritative than they are.

### 3. Hybrid actual/estimated usage

Use actual counts when available and estimates otherwise. This avoids missing metrics but mixes incompatible measurements in one dashboard, so it was rejected.

## Design

### DeepSeek response boundary

Extend `GeneratedAnswer` with optional input, output, and total token counts. `DeepSeekClient.generate()` will parse the response once, keep the existing answer/citation behavior, and read the integer fields from `response["usage"]` when all are valid non-negative integers. Missing or malformed usage produces no token telemetry rather than failing generation.

### Generation service

Start `rag.deepseek` with `run_type="llm"`. After successful generation, pass the optional usage counts when ending that child run. No usage is recorded for insufficient-evidence paths because DeepSeek is not called.

### Observability adapter

Add a narrow token-usage value type and an optional usage argument to `TraceRun.end()`. The LangSmith implementation will set only:

- `input_tokens`
- `output_tokens`
- `total_tokens`

using LangSmith's recognized `usage_metadata` field before patching the run. The adapter validates non-negative integers and suppresses every SDK failure with the existing sanitized warning. The no-op implementation ignores usage.

### Privacy and failure behavior

Token metadata contains counts only. It is separate from content capture, so enabling or disabling `LANGSMITH_CAPTURE_CONTENT` does not affect usage reporting. Provider response bodies and parse errors are never logged or traced. Trace failures cannot interrupt retrieval, generation, citation processing, or the API response.

## Testing

- DeepSeek client test: valid provider usage is returned with the generated answer.
- DeepSeek client test: missing or malformed usage preserves successful answer generation without usage telemetry.
- Generation service test: `rag.deepseek` is an LLM run and receives the exact counts.
- Adapter test: exact counts become LangSmith `usage_metadata`; unrelated or invalid fields cannot pass through.
- Adapter/service failure tests: usage update failures remain fail-open.
- Existing privacy, trace-content, insufficient-evidence, provider-error, API, and full-stack suites remain green.
