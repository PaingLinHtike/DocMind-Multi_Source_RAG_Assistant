# LangSmith Observability Design

## Intent

Add production observability to DocMind's existing FastAPI RAG pipeline without converting it to LangChain and without sending document text, prompts, answers, credentials, or directly identifying IDs to LangSmith.

## Goals

- Trace answer generation as one parent operation with retrieval, prompt construction, and DeepSeek generation child operations.
- Capture useful operational metadata: model, duration, success/failure, requested and retrieved document counts, retrieved chunk count, citation count, and insufficient-evidence outcomes.
- Keep tracing disabled by default and controlled through environment variables.
- Ensure LangSmith outages or tracing failures never break retrieval or answer generation.
- Make the behavior testable without network access or paid API calls.

## Non-goals

- Migrating the custom `httpx` DeepSeek client to LangChain.
- Capturing full prompts, questions, document chunks, model answers, API keys, authorization headers, or raw user/document/conversation/message identifiers.
- Adding frontend analytics or Laravel request tracing in this change.
- Replacing application logs, metrics, or error monitoring.

## Constraints and security boundaries

- RAG documents and user questions are private application data and must not cross into the third-party observability service.
- API keys remain local environment values and must never be committed, logged, attached as trace metadata, or included in exceptions.
- The LangSmith and DeepSeek keys shared in chat are considered compromised and must be revoked and replaced before enabling tracing.
- Trace identifiers derived from application IDs use a keyed HMAC with a dedicated local salt so LangSmith cannot recover raw IDs or correlate them without that salt.
- Monitoring is fail-open: tracing exceptions are suppressed and generation continues, while a sanitized local warning identifies observability failure.

## Approaches considered

### Selected: native LangSmith SDK with an application tracing adapter

Keep the current retrieval, prompt, and DeepSeek code. Add the `langsmith` dependency and a small adapter that owns trace lifecycle, sanitization, metadata allowlisting, ID hashing, and no-op behavior. This is the smallest change and gives explicit control over data sent off-platform.

### Rejected: convert generation to LangChain

Using `ChatOpenAI` with DeepSeek's compatible endpoint would provide automatic tracing, but it would replace working generation code, add unnecessary dependencies, and make prompt/content capture easier to enable accidentally.

### Rejected: call LangSmith's REST API directly

This avoids the SDK dependency but duplicates client behavior, error handling, and trace hierarchy semantics. It has higher maintenance and correctness risk.

## Design

### Configuration

Add these settings to `Settings` and `.env.example`, without real values:

- `LANGSMITH_TRACING=false`
- `LANGSMITH_API_KEY=`
- `LANGSMITH_PROJECT=docmind-rag`
- `LANGSMITH_ENDPOINT=https://api.smith.langchain.com`
- `LANGSMITH_HASH_SALT=`

Tracing is active only when `LANGSMITH_TRACING` is true and the API key and hash salt are present. Missing tracing configuration leaves the application functional and emits a sanitized startup/runtime warning rather than exposing values.

### Adapter

Create an observability module with a narrow interface used by the RAG pipeline. It provides a no-op implementation when tracing is disabled and a LangSmith implementation when enabled. The adapter sends only allowlisted metadata and summarized outputs; callers never pass secrets or raw retrieved content into trace payloads.

### Trace hierarchy

An answer request creates:

1. `rag.answer` parent run
2. `rag.retrieve` child run
3. `rag.prompt` child run
4. `rag.deepseek` child run

The parent records the final status and citation count. Retrieval records requested document count and retrieved chunk count. Prompt construction records context chunk count and budget, not prompt text. DeepSeek records model, duration, success/failure category, and used citation count, not messages or response text.

### Correlation and metadata

The API passes a small trace context containing conversation/message correlation identifiers. The adapter HMAC-hashes these values before transmission. User and document IDs are represented only as counts unless a stable correlation value is operationally necessary; any such value is HMAC-hashed before leaving the service.

### Failure behavior

Tracing setup, start, update, and end calls are guarded. LangSmith errors produce a sanitized local warning and do not change the answer result or exception path. DeepSeek and application failures retain their existing behavior and are represented in LangSmith only by a bounded category such as `provider_error`, never by raw provider bodies.

### Tests

- Configuration parsing tests cover disabled defaults and enabled settings.
- Adapter tests prove disabled tracing is a no-op and sends no network traffic.
- Sanitization tests prove questions, prompts, answers, document text, keys, authorization headers, and raw IDs are absent from serialized trace data.
- Generation-service tests verify trace hierarchy and metadata for success, insufficient evidence, and provider failure.
- Failure-isolation tests verify a broken tracer cannot break answer generation.

## Builder decisions left open

- Use the current stable LangSmith Python SDK API available through the project's `uv` dependency workflow.
- Keep implementation names consistent with the existing `src/generation` and dependency-injection patterns.
- Prefer explicit trace lifecycle calls over decorators where decorators would automatically capture function arguments or return values.
