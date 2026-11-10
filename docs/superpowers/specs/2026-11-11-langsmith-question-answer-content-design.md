# LangSmith Question and Answer Content Design

## Intent

Make LangSmith traces useful for local RAG debugging by showing the submitted question and final answer on the root `rag.answer` run, while keeping document-derived content private.

## Goals

- Show `{ "question": "..." }` as the root trace input when explicitly enabled.
- Show `{ "answer": "..." }` alongside the existing root status/count outputs when explicitly enabled.
- Keep retrieved chunks, prompts, credentials, raw IDs, and child-run content out of LangSmith.
- Preserve the current metadata-only behavior by default.

## Non-goals

- Do not trace sign-in or other Laravel requests.
- Do not upload retrieved chunks, generated prompts, source documents, authorization headers, or provider response bodies.
- Do not enable content capture in committed defaults.

## Constraints

- Content capture requires both `LANGSMITH_TRACING=true` and `LANGSMITH_CAPTURE_CONTENT=true`.
- `LANGSMITH_CAPTURE_CONTENT` defaults to `false` and invalid values fail closed.
- Local secrets and the local opt-in remain in ignored `.env` files.
- Tracing failures remain fail-open and must not affect answer generation.

## Approaches

1. **Opt-in root question and answer — selected.** Useful debugging content appears only on `rag.answer`; child spans stay metadata-only. This balances observability with document privacy.
2. **Metadata only.** Safest, but does not provide the requested input/output visibility.
3. **Full pipeline content.** Most detailed, but would upload document chunks and prompts to a third party and was rejected for privacy risk.

## Design

Add a `langsmith_capture_content` setting sourced from `LANGSMITH_CAPTURE_CONTENT`. The generation service supplies the question when starting the root run and the final answer when ending it only when the setting is enabled. The LangSmith observer independently allowlists `question` on root inputs and `answer` on root outputs, while child runs remain unable to emit content. Tests cover the default-off path, explicit opt-in, invalid configuration, insufficient-evidence answers, child-span isolation, and fail-open behavior.
