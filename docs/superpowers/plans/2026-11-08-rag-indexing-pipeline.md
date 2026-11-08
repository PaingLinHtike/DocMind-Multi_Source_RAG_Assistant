# RAG Document Indexing Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an asynchronous, user-isolated pipeline that turns uploaded PDF, DOCX, and TXT files into cleaned, deduplicated, E5-embedded chunks stored in ChromaDB and exposes live progress on the existing document details screen.

**Architecture:** React continues to call Laravel only. Laravel stores the source file and canonical status in PostgreSQL, then a database-queue job sends the file and trusted ownership metadata to an internal FastAPI endpoint. FastAPI parses, cleans, chunks, embeds, and atomically replaces that document's vectors in persistent ChromaDB before Laravel marks it ready or failed.

**Tech Stack:** React 19, Vite 8, Laravel 13/PHP 8.5, Laravel database queues, FastAPI, LangChain text splitters, Sentence Transformers `intfloat/e5-base-v2`, ChromaDB, PostgreSQL, pytest, PHPUnit, Vitest.

**Spec:** `C:\Users\pyaes\.opencode\plan\2026-11-08-rag-indexing-pipeline.md#approved-design-contract`

## Approved Design Contract

- Approach 1 is approved: Laravel is the authenticated public API and asynchronous orchestrator; FastAPI is an internal RAG service.
- Selecting a row on `/documents` opens `/documents/:documentId`, which becomes the operational RAG screen. Do not add a top-level RAG navigation item.
- Indexing stages are `queued`, `parsing`, `preprocessing`, `chunking`, `embedding`, `storing`, `ready`, and `failed`.
- Cleaning removes empty/null text, normalizes text safely, and deterministically removes duplicates without merging different users' documents.
- E5 document inputs use the `passage: ` prefix. Chroma queries in the second plan use `query: `.
- Chroma records are scoped by `user_id` and `document_id`; PostgreSQL remains canonical and ChromaDB remains a derived index.
- Reindexing replaces a document's prior vectors idempotently. Deleting a document also deletes its vectors.

## Global Constraints

- Start by creating `feature/rag` from the current `feature/laravel-backend` branch; preserve the existing uncommitted `backend/.env.example` change and never overwrite or discard it.
- Before editing Laravel files, confirm installed package versions and follow `backend/AGENTS.md`; do not introduce a new top-level application directory.
- Use the existing `RAG_PRODUCTION_SYSTEM/src` module layout; replace empty module bodies rather than creating a competing RAG tree.
- Keep `DEEPSEEK_API_KEY`, internal service secrets, document text, prompts, and vectors out of logs and source control.
- FastAPI internal endpoints require `X-Internal-Token`; ownership fields come from Laravel, never directly from browser input.
- Default embedding model is exactly `intfloat/e5-base-v2`; make model name, Chroma path, collection name, chunk size, overlap, request timeout, and service URLs configurable.
- Use TDD, run the narrowest relevant test after each change, and commit after each task.
- Do not implement query expansion, fusion, BM25, reranking, or evaluation automation in this MVP.

## Review Focus

- Empty, whitespace-only, or image-only files must fail cleanly without leaving stale vectors; Task 2 owns this test.
- Repeated paragraphs and repeated queue deliveries must not create duplicate chunks; Tasks 2 and 4 own these tests.
- Two users with identical documents must remain isolated in ChromaDB; Task 4 owns this test.
- A crash after deleting old vectors but before storing new vectors must not leave a ready document with a partial index; Task 4 owns the atomic replacement test.
- The browser must stop polling when the document becomes ready, failed, is deleted, or the component unmounts; Task 7 owns this test.

---

### Task 1: Branch, FastAPI Application, Configuration, and Internal Authentication

**Files:**
- Create: `RAG_PRODUCTION_SYSTEM/src/__init__.py`
- Create: `RAG_PRODUCTION_SYSTEM/src/api/__init__.py`
- Create: `RAG_PRODUCTION_SYSTEM/src/api/main.py`
- Create: `RAG_PRODUCTION_SYSTEM/src/api/security.py`
- Create: `RAG_PRODUCTION_SYSTEM/src/config.py`
- Create: `RAG_PRODUCTION_SYSTEM/tests/test_api_health.py`
- Modify: `requirements.txt`
- Modify: `RAG_PRODUCTION_SYSTEM/.env` only locally; never commit secrets
- Modify: `RAG_PRODUCTION_SYSTEM/Dockerfile`

**Interfaces:**
- Consumes: Environment variables `RAG_INTERNAL_TOKEN`, `CHROMA_PERSIST_DIRECTORY`, `CHROMA_COLLECTION`, `EMBEDDING_MODEL`, `CHUNK_SIZE`, and `CHUNK_OVERLAP`.
- Produces: `Settings`, `get_settings() -> Settings`, `require_internal_token(x_internal_token: str) -> None`, and FastAPI `app` with `GET /health`.

- [ ] **Step 1: Create the branch without disturbing user work**

Run `git status --short --branch`, record the existing `backend/.env.example` modification, then run `git switch -c feature/rag`. Expected: branch is `feature/rag` and the pre-existing modification remains present.

- [ ] **Step 2: Write failing configuration and authentication tests**

In `test_api_health.py`, add tests named `test_health_is_public`, `test_internal_route_rejects_missing_token`, and `test_settings_use_e5_defaults`; assert HTTP 200 for health, HTTP 401 for a protected probe without the header, and defaults `intfloat/e5-base-v2`, chunk size `512`, overlap `64`.

- [ ] **Step 3: Run the tests and verify failure**

Run `python -m pytest RAG_PRODUCTION_SYSTEM/tests/test_api_health.py -v`. Expected: FAIL because `src.api.main` and settings do not exist.

- [ ] **Step 4: Implement the application foundation**

Implement cached environment settings, constant-time internal-token comparison, public health response `{"status":"ok"}`, and a test-only protected probe or dependency override target. Add only dependencies actually imported; pin compatible versions after checking the active Python version.

- [ ] **Step 5: Verify and commit**

Run the targeted pytest command, then build/import the app with `python -c "from RAG_PRODUCTION_SYSTEM.src.api.main import app; print(app.title)"`. Expected: tests PASS and import succeeds. Commit as `feat(rag): add FastAPI service foundation` without staging the user's unrelated `.env.example` change unless it is intentionally updated in a later task.

### Task 2: Secure Loading, Parsing, Cleaning, and Duplicate Removal

**Files:**
- Modify: `RAG_PRODUCTION_SYSTEM/src/ingestion/loader.py`
- Modify: `RAG_PRODUCTION_SYSTEM/src/ingestion/splitter.py`
- Create: `RAG_PRODUCTION_SYSTEM/src/ingestion/models.py`
- Create: `RAG_PRODUCTION_SYSTEM/tests/ingestion/test_loader.py`
- Create: `RAG_PRODUCTION_SYSTEM/tests/ingestion/test_preprocessor.py`

**Interfaces:**
- Consumes: `load_document(content: bytes, extension: str, filename: str) -> list[SourcePage]`.
- Produces: `SourcePage(text: str, page_number: int | None)`, `CleanSection(text: str, page_number: int | None, content_hash: str)`, and `clean_sections(pages: Sequence[SourcePage]) -> list[CleanSection]`.

- [ ] **Step 1: Write failing parser tests**

Cover valid TXT and PDF extraction, supported extension validation for `pdf`, `docx`, and `txt`, malformed input, and a maximum decompressed-text limit. Assert unsupported or unreadable content raises a typed `DocumentLoadError` without including source text in its message.

- [ ] **Step 2: Write failing preprocessing tests**

Test CRLF/Unicode whitespace normalization, removal of null/empty sections, preservation of paragraph boundaries and page numbers, exact duplicate removal by normalized SHA-256 hash, stable first-occurrence ordering, and failure with `EmptyDocumentError` for whitespace-only/image-only input.

- [ ] **Step 3: Run tests and verify failure**

Run `python -m pytest RAG_PRODUCTION_SYSTEM/tests/ingestion -v`. Expected: FAIL because models and functions are absent.

- [ ] **Step 4: Implement minimal parsers and cleaner**

Use `pypdf` for PDF, a reviewed DOCX parser dependency for DOCX, and strict UTF-8 with safe fallback for TXT. Normalize Unicode and whitespace without lowercasing or stripping meaningful punctuation; deduplicate within one document only.

- [ ] **Step 5: Verify and commit**

Run ingestion tests. Expected: all PASS. Commit as `feat(rag): parse and clean uploaded documents`.

### Task 3: Token-Aware Chunking, Metadata, and E5 Embeddings

**Files:**
- Modify: `RAG_PRODUCTION_SYSTEM/src/chunking/chunker.py`
- Modify: `RAG_PRODUCTION_SYSTEM/src/chunking/overlap_manager.py`
- Modify: `RAG_PRODUCTION_SYSTEM/src/chunking/metadata_tagger.py`
- Modify: `RAG_PRODUCTION_SYSTEM/src/embedding/base_embedder.py`
- Create: `RAG_PRODUCTION_SYSTEM/src/embedding/e5_embedder.py`
- Modify: `RAG_PRODUCTION_SYSTEM/src/embedding/embedding_cache.py`
- Create: `RAG_PRODUCTION_SYSTEM/tests/chunking/test_chunker.py`
- Create: `RAG_PRODUCTION_SYSTEM/tests/embedding/test_e5_embedder.py`

**Interfaces:**
- Consumes: `Sequence[CleanSection]`, trusted `user_id`, `document_id`, `filename`, and configurable size/overlap.
- Produces: `DocumentChunk(id: str, text: str, metadata: dict[str, str | int])`, `chunk_sections(...) -> list[DocumentChunk]`, and `E5Embedder.embed_passages(texts: Sequence[str]) -> list[list[float]]`.

- [ ] **Step 1: Write failing chunk tests**

Assert deterministic IDs from document ID plus content hash/index, configurable token-bounded chunks, overlap, no blank chunks, page/source metadata preservation, and metadata keys `user_id`, `document_id`, `filename`, `page_number`, `chunk_index`, and `content_hash`.

- [ ] **Step 2: Write failing embedding tests**

Inject a fake Sentence Transformer and assert every passage is prefixed exactly once with `passage: `, batch order is stable, vectors are normalized for cosine search, and empty input returns an empty list without loading the model.

- [ ] **Step 3: Run tests and verify failure**

Run `python -m pytest RAG_PRODUCTION_SYSTEM/tests/chunking RAG_PRODUCTION_SYSTEM/tests/embedding -v`. Expected: FAIL for missing implementations.

- [ ] **Step 4: Implement chunking and E5 adapter**

Use a tokenizer-aware recursive splitter compatible with E5's tokenizer. Keep model loading lazy and cache only by model name plus prefixed normalized text hash; do not log text or vectors.

- [ ] **Step 5: Verify and commit**

Run targeted tests. Expected: PASS. Commit as `feat(rag): chunk documents and create E5 embeddings`.

### Task 4: ChromaDB Repository and Idempotent Indexing Service

**Files:**
- Create: `RAG_PRODUCTION_SYSTEM/src/vectorstore/__init__.py`
- Create: `RAG_PRODUCTION_SYSTEM/src/vectorstore/chroma_repository.py`
- Create: `RAG_PRODUCTION_SYSTEM/src/indexing/__init__.py`
- Create: `RAG_PRODUCTION_SYSTEM/src/indexing/service.py`
- Create: `RAG_PRODUCTION_SYSTEM/tests/vectorstore/test_chroma_repository.py`
- Create: `RAG_PRODUCTION_SYSTEM/tests/indexing/test_indexing_service.py`

**Interfaces:**
- Consumes: parser, cleaner, chunker, `E5Embedder`, and `IndexDocumentCommand(user_id, document_id, filename, extension, content)`.
- Produces: `ChromaRepository.replace_document(...) -> int`, `delete_document(user_id: str, document_id: str) -> None`, and `IndexingService.index(command, progress: Callable[[str], None]) -> IndexResult(chunk_count: int, collection: str, embedding_model: str)`.

- [ ] **Step 1: Write failing repository tests**

Use an ephemeral Chroma client. Assert upserts include vectors/documents/metadata, replacing the same document twice is idempotent, deleting one user's document cannot delete another user's identical document, and filters always include both `user_id` and `document_id` where applicable.

- [ ] **Step 2: Write failing orchestration tests**

Assert progress sequence `parsing → preprocessing → chunking → embedding → storing`, successful chunk count, stale-vector replacement, duplicate-delivery stability, and rollback/cleanup behavior when storage fails so a partial index is never reported successful.

- [ ] **Step 3: Run tests and verify failure**

Run `python -m pytest RAG_PRODUCTION_SYSTEM/tests/vectorstore RAG_PRODUCTION_SYSTEM/tests/indexing -v`. Expected: FAIL for missing repository/service.

- [ ] **Step 4: Implement repository and indexing orchestration**

Stage the complete new vector set under deterministic IDs, upsert it, verify stored count, then remove stale IDs. If replacement fails, preserve or restore the previous usable set and raise a typed indexing error.

- [ ] **Step 5: Verify and commit**

Run targeted tests. Expected: PASS, including duplicate and isolation cases. Commit as `feat(rag): store document embeddings in ChromaDB`.

### Task 5: Internal FastAPI Index and Delete Endpoints

**Files:**
- Create: `RAG_PRODUCTION_SYSTEM/src/api/indexing.py`
- Modify: `RAG_PRODUCTION_SYSTEM/src/api/main.py`
- Create: `RAG_PRODUCTION_SYSTEM/tests/api/test_indexing_api.py`

**Interfaces:**
- Consumes: authenticated multipart request with file plus `user_id`, `document_id`, `filename`, and `extension`.
- Produces: `POST /internal/v1/documents/index` returning `{chunk_count, collection, embedding_model}` and `DELETE /internal/v1/documents/{document_id}?user_id=...` returning HTTP 204.

- [ ] **Step 1: Write failing API contract tests**

Assert valid token and upload invoke `IndexingService`; missing/wrong token returns 401; unsupported extension returns 422; empty document returns 422; oversized request returns 413; internal exceptions return a sanitized error and 500; delete passes both IDs.

- [ ] **Step 2: Run tests and verify failure**

Run `python -m pytest RAG_PRODUCTION_SYSTEM/tests/api/test_indexing_api.py -v`. Expected: FAIL because routes do not exist.

- [ ] **Step 3: Implement endpoint dependency injection and error mapping**

Keep service construction in FastAPI dependencies so tests never download E5. Do not accept a filesystem path from Laravel; accept bytes via multipart and enforce configured limits.

- [ ] **Step 4: Verify and commit**

Run API and all Python tests. Expected: PASS. Commit as `feat(rag): expose internal indexing API`.

### Task 6: Laravel Queue Integration and Canonical Indexing State

**Files:**
- Create: `backend/database/migrations/*_add_rag_metadata_to_documents_table.php`
- Modify: `backend/app/Models/Document.php`
- Create: `backend/app/Jobs/IndexDocument.php`
- Create: `backend/app/Jobs/DeleteDocumentIndex.php`
- Create: `backend/app/Services/FastApiRagClient.php`
- Modify: `backend/app/Http/Controllers/Api/V1/DocumentController.php`
- Modify: `backend/app/Http/Controllers/Api/V1/ReindexDocumentController.php`
- Modify: `backend/config/docmind.php`
- Modify: `backend/.env.example`
- Modify: `backend/tests/Feature/Api/V1/DocumentTest.php`
- Create: `backend/tests/Feature/Jobs/IndexDocumentTest.php`

**Interfaces:**
- Consumes: stored `Document`, Laravel HTTP client, queue, `FASTAPI_BASE_URL`, `FASTAPI_INTERNAL_TOKEN`, and `FASTAPI_TIMEOUT`.
- Produces: `FastApiRagClient::index(Document $document): IndexResult`, `deleteIndex(string $userId, string $documentId): void`, queued `IndexDocument`, and canonical `status`, `rag_stage`, `chunk_count`, `failure_reason`, `indexed_at`, `embedding_model`, and `vector_collection` updates.

- [ ] **Step 1: Generate migration/job/test scaffolds with Artisan**

Use `php artisan make:migration`, `make:job`, and `make:test --phpunit --no-interaction` from `backend`; do not hand-create Laravel framework classes.

- [ ] **Step 2: Write failing upload, reindex, delete, and job tests**

Assert upload commits `PENDING/queued` and dispatches `IndexDocument` after commit; reindex resets metadata and dispatches once; job transitions through `PROCESSING` to `READY/ready` and records model/collection; failures store `FAILED/failed` with sanitized reason; missing source file fails safely; deletion dispatches `DeleteDocumentIndex` with captured user/document IDs; retries remain idempotent.

- [ ] **Step 3: Run tests and verify failure**

Run `php artisan test --compact tests/Feature/Api/V1/DocumentTest.php tests/Feature/Jobs/IndexDocumentTest.php`. Expected: FAIL for missing jobs/client/state.

- [ ] **Step 4: Implement queue and HTTP client behavior**

Open the file from its configured Laravel disk and attach bytes to the internal request. Configure retry/backoff and timeout; mark failed only after terminal failure. Keep the queue call outside unsafe transaction timing by dispatching after commit.

- [ ] **Step 5: Format, verify, and commit**

Run `vendor/bin/pint --dirty --format agent`, the targeted tests, and `php artisan migrate:fresh --env=testing --no-interaction`. Expected: formatting clean and tests PASS. Commit as `feat(rag): queue document indexing through FastAPI`.

### Task 7: Document Operational RAG Screen and Polling

**Files:**
- Modify: `backend/app/Http/Resources/Api/V1/DocumentResource.php`
- Modify: `frontend/src/api/documents.js`
- Modify: `frontend/src/pages/DocumentDetailsPage.jsx`
- Create: `frontend/src/components/documents/RagPipeline.jsx`
- Modify: `frontend/src/test/documents.test.jsx`

**Interfaces:**
- Consumes: document JSON fields `status_label`, `rag_stage`, `chunks`, `failure_reason`, `indexed_at`, `embedding_model`, and `vector_collection`.
- Produces: accessible `RagPipeline({ stage, status, failureReason })` and abortable polling of `GET /api/v1/documents/{id}` while pending/processing.

- [ ] **Step 1: Write failing backend resource assertions**

Extend `DocumentTest` to assert operational fields are returned for an owned document but do not expose internal tokens, raw storage credentials, or document content.

- [ ] **Step 2: Write failing React tests**

Assert the document row links to details, the details page shows all ordered stages, current/completed/error states, chunk/model/index metadata, failure reason, and Reindex. With fake timers, assert polling continues during queued/processing and stops on ready, failed, 404, unauthorized, and unmount.

- [ ] **Step 3: Run tests and verify failure**

Run Laravel's targeted `DocumentTest` and `npm test -- --run src/test/documents.test.jsx` from `frontend`. Expected: FAIL for missing fields/component/polling.

- [ ] **Step 4: Implement the operational screen**

Enhance the existing `/documents/:documentId` screen; do not add a nav item or duplicate route. Use text plus icons/colors for status, `aria-live` for transitions, and an abort controller for each poll interval.

- [ ] **Step 5: Verify and commit**

Run targeted PHP/React tests, `npm run lint`, and `npm run build`. Expected: PASS. Commit as `feat(rag): show document indexing pipeline`.

### Task 8: Integration Verification and Runtime Documentation

**Files:**
- Modify: `RAG_PRODUCTION_SYSTEM/Dockerfile`
- Create: `RAG_PRODUCTION_SYSTEM/README.md`
- Modify: root `requirements.txt` if dependency pins were not already finalized
- Create: `RAG_PRODUCTION_SYSTEM/tests/integration/test_indexing_pipeline.py`

**Interfaces:**
- Consumes: all indexing interfaces from Tasks 1–7.
- Produces: repeatable local startup instructions and one integration test proving upload bytes become isolated vectors with progress/result metadata.

- [ ] **Step 1: Write the integration test**

Use temporary Chroma storage, fake deterministic E5 vectors, and a representative multi-page fixture. Assert parse → clean → chunk → embed → store, then reindex and delete; do not require network access or a downloaded model.

- [ ] **Step 2: Run and verify the test initially exposes wiring gaps**

Run `python -m pytest RAG_PRODUCTION_SYSTEM/tests/integration/test_indexing_pipeline.py -v`. Expected before final wiring: FAIL at the first missing dependency/wiring boundary.

- [ ] **Step 3: Complete runtime wiring and documentation**

Document queue worker, FastAPI start command, Chroma volume, environment variables, supported file types, stage meanings, and recovery/reindex procedure. Ensure Docker runs as a non-root user and persists only the configured Chroma directory.

- [ ] **Step 4: Run full verification**

Run `python -m pytest RAG_PRODUCTION_SYSTEM/tests -v`, `php artisan test --compact`, `vendor/bin/pint --dirty --format agent`, `npm test -- --run`, `npm run lint`, and `npm run build`. Expected: all PASS.

- [ ] **Step 5: Commit**

Commit as `test(rag): verify document indexing pipeline` and confirm `git status --short` contains only intentional work plus any explicitly preserved pre-existing change.
