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
