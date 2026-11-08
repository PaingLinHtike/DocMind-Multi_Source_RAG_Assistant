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
