# DocMind RAG service

Internal FastAPI service for document indexing, semantic retrieval, and DeepSeek-grounded answers.

## Local setup

1. Install root Python dependencies: `python -m pip install -r requirements.txt`.
2. Copy `RAG_PRODUCTION_SYSTEM/.env.example` to `.env` and set the shared internal token.
3. Configure the same token as `FASTAPI_INTERNAL_TOKEN` in `backend/.env`.
4. Start FastAPI: `uvicorn RAG_PRODUCTION_SYSTEM.src.api.main:app --port 8001`.
5. Start Laravel's queue worker: `php backend/artisan queue:work`.

ChromaDB persists beneath `CHROMA_PERSIST_DIRECTORY`. Back up that directory with the application database, but treat it as a rebuildable derived index. Never commit it.

## Indexing lifecycle

Laravel stores uploads and queues `IndexDocument`. The service parses PDF, DOCX, or TXT; removes empty and exact duplicate sections; creates overlapping chunks; embeds them with `intfloat/e5-base-v2`; and replaces the document's user-scoped Chroma records. Stages are queued, parsing, preprocessing, chunking, embedding, storing, ready, and failed.

Reindex from the document Actions menu. A failed source remains available and its sanitized failure reason appears on the document screen.

## Smoke test

Upload a supported document, run both workers, wait for **Ready**, then open its details to confirm chunk/model/collection metadata. Continue with Chat after configuring `DEEPSEEK_API_KEY`.

## Retrieval and generation

Questions are embedded with E5's `query: ` prefix and searched by cosine similarity. Every Chroma query is filtered by Laravel's trusted user ID. The default retrieval count is 5 with a 0.2 minimum similarity; tune these with `RETRIEVAL_TOP_K` and `MINIMUM_SIMILARITY`.

Retrieved chunks are bounded by `CONTEXT_TOKEN_BUDGET`, delimited as untrusted sources, and sent to DeepSeek at `DEEPSEEK_BASE_URL`. The model is instructed to answer only from evidence and cite numbered sources. When no evidence qualifies, the service returns an insufficient-evidence answer without calling DeepSeek.

For recovery, inspect the Laravel queue failure, correct credentials/connectivity, and retry the failed job. Rotate `RAG_INTERNAL_TOKEN` and `FASTAPI_INTERNAL_TOKEN` together. Logs intentionally omit source text, prompts, answers, vectors, and secrets.

## LangSmith observability

LangSmith tracing is optional and disabled by default. DocMind uses the native LangSmith SDK around the existing retrieval and DeepSeek pipeline; it does not require a LangChain generation wrapper. Traces contain stage names, timings, bounded status categories, counts, model name, and HMAC-hashed correlation identifiers. Retrieved chunks, prompts, raw application IDs, vectors, credentials, authorization headers, provider response bodies, and exception details are always excluded.

Before enabling tracing, revoke any key that has been pasted into chat, logs, tickets, or source control and create a replacement. Then configure local secrets without committing them:

```env
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=your-new-langsmith-key
LANGSMITH_PROJECT=docmind-rag
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
LANGSMITH_HASH_SALT=generate-a-separate-long-random-secret
LANGSMITH_CAPTURE_CONTENT=false
```

`LANGSMITH_HASH_SALT` must be dedicated to observability; do not reuse the RAG internal token or another credential. If tracing configuration is incomplete, the service disables tracing. LangSmith setup or transport failures are fail-open: answer generation continues and local logs receive only a sanitized warning.

Question and answer capture is a separate, explicit opt-in. Set `LANGSMITH_CAPTURE_CONTENT=true` only when sending user questions and generated answers to LangSmith is acceptable. When enabled, the root `rag.answer` run includes the question as its input and the final answer as its output. Child runs remain metadata-only, and document chunks and prompts are never sent. Keep the committed default disabled and enable it only in an ignored local or deployment-specific environment file after reviewing the data policy for that environment.

### Smoke check

1. Enable tracing with replacement credentials in `RAG_PRODUCTION_SYSTEM/.env`.
2. Start FastAPI and submit a synthetic question against a synthetic test document containing no private data.
3. In the `docmind-rag` LangSmith project, confirm one `rag.answer` run with `rag.retrieve`, `rag.prompt`, and `rag.deepseek` children.
4. With content capture disabled, confirm run inputs are empty and metadata/outputs contain only counts, statuses, model name, and hashed identifiers.
5. With content capture explicitly enabled, confirm only the root `rag.answer` input contains the synthetic question and only its output contains the synthetic answer; child runs must still contain no document text or prompt.
