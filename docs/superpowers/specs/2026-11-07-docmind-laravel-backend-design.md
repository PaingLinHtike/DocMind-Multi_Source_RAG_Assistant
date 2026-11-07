# DocMind Laravel Backend Design

## Intent

Create a Laravel REST API in `backend/` that replaces the React prototype's mock data with persistent, user-scoped PostgreSQL data. The backend will support the current authentication, dashboard, document, upload, chat, and account-settings screens. Python RAG processing will be implemented later, so this version must preserve a clean FastAPI integration boundary without generating fake AI answers.

## Why

The current React application is a working UI prototype, but authentication, documents, chats, uploads, settings, and dashboard values are stored in JavaScript or browser storage. The backend must make those features real, private per user, and ready for a later document-processing and answer-generation service.

## Goals

- Scaffold a current Laravel application in `backend/` using the installed PHP and Composer toolchain.
- Connect Laravel to PostgreSQL database `docmind_db` on `127.0.0.1:5432` as user `postgres` with the supplied password.
- Expose versioned JSON endpoints under `/api/v1`.
- Use Laravel Sanctum stateful cookie authentication for the React SPA.
- Implement the API resources and actions represented by the existing React screens.
- Store uploaded PDF, DOCX, and TXT files and their metadata.
- Scope every document, conversation, message, citation, metric, and account action to the authenticated user.
- Store chat questions in a state that can later be processed by FastAPI.
- Include automated feature tests for authentication, authorization, validation, and core CRUD flows.

## Non-goals

- Rewriting the React frontend to call these endpoints.
- Building or changing the Python/FastAPI RAG service.
- Parsing, chunking, embedding, indexing, semantic retrieval, or LLM generation.
- Returning fabricated assistant answers while the RAG service is unavailable.
- Docker or production hosting configuration in this phase.
- Social login, email verification, production mail-provider setup, roles, teams, or shared documents.

## Anti-goals

- Do not expose one user's resources to another user, including through numeric or UUID guessing.
- Do not store plaintext passwords or return password fields in JSON.
- Do not place database or future LLM credentials in source code.
- Do not couple controllers directly to a specific Python endpoint contract.
- Do not report a document as indexed or an answer as generated when no RAG processor has run.

## Constraints and Existing Project Findings

- `backend/` currently contains only an empty `.env`; it is safe to scaffold Laravel there while preserving and replacing that empty file.
- PHP 8.5.11 and Composer 2.10.3 are installed.
- PostgreSQL connection: host `127.0.0.1`, port `5432`, database `docmind_db`, username `postgres`, password supplied by the user.
- React is served separately by Vite and currently has no API client.
- The UI supports PDF, DOCX, and TXT uploads, document search/details/actions, conversations, messages with citations, account changes, recent chats/uploads, and dashboard metrics.
- The Python folder contains RAG modules but no FastAPI application. Integration is deferred.

## Approaches Considered

### 1. Sanctum bearer tokens

React would store and send an API token. This is simple for Postman and non-browser clients, but requires safely managing a long-lived browser token and was not selected.

### 2. Sanctum stateful cookie authentication — selected

React first requests `/sanctum/csrf-cookie`, then sends session cookies and the XSRF header with credentialed requests. Laravel handles registration, login, logout, and authenticated sessions. This avoids browser token storage and is the best fit for the selected browser-first React SPA, at the cost of stricter CORS, cookie-domain, and local-origin configuration.

### 3. Placeholder Laravel RAG responses

Laravel could return mock assistant answers until FastAPI exists. This would make the UI look complete but would create misleading, non-grounded responses and temporary behavior that must be removed. It was rejected.

## Application Structure

- Controllers remain thin: validate requests, authorize the resource, invoke an application service when needed, and return API resources.
- Form Request classes own input validation and resource authorization.
- Eloquent models and policies enforce ownership.
- API Resource classes provide stable JSON shapes for React.
- A `RagGateway` contract defines the future integration. The initial implementation records pending work and reports that processing is unavailable; it does not make external HTTP calls.
- UUIDs are used as public identifiers for documents, conversations, messages, and citations. Database user IDs may remain Laravel's default internal IDs.

## Data Model

### users

Laravel's user fields plus `name`, unique `email`, hashed `password`, timestamps, and session-compatible authentication fields.

### documents

- `id` UUID
- `user_id`
- `name`, `original_name`, `extension`, `mime_type`
- `source_type` (`upload` initially; `web` reserved for later)
- `status` (`uploaded`, `pending`, `processing`, `ready`, `failed`)
- `storage_disk`, `storage_path`, `size_bytes`
- nullable `chunk_count`, `failure_reason`, `indexed_at`
- timestamps

Files use Laravel's configured private/local disk. Download and original-file access always pass through an authorized endpoint.

### conversations

- `id` UUID
- `user_id`
- `title`
- timestamps, with `updated_at` representing recent activity

### messages

- `id` UUID
- `conversation_id`
- `role` (`user`, `assistant`)
- `content`
- `status` (`pending`, `processing`, `completed`, `failed`)
- nullable `failure_reason`
- timestamps

User questions are accepted and persisted with `pending` status. No assistant message is created until a future RAG processor returns a real answer.

### citations

- `id` UUID
- `message_id`
- `document_id`
- nullable `page_number`, `chunk_reference`, `excerpt`
- `position` for deterministic display order
- timestamps

The table is created now so future assistant responses can be stored without a destructive schema redesign.

## API Contract

All JSON application routes use `/api/v1`. Successful item responses use `{ "data": ... }`; collection responses use Laravel resource collections and pagination metadata where applicable. Validation errors use Laravel's standard `422` JSON shape. Unauthenticated requests return `401`; forbidden cross-user access is hidden as `404` where route-model binding/policies permit.

### Authentication

- `GET /sanctum/csrf-cookie` — initialize CSRF protection.
- `POST /api/v1/auth/register` — create user and authenticated session.
- `POST /api/v1/auth/login` — authenticate and regenerate the session.
- `POST /api/v1/auth/logout` — invalidate the current session.
- `GET /api/v1/auth/user` — current user.
- `POST /api/v1/auth/forgot-password` — create and send a Laravel password-reset link using the configured mail driver.
- `POST /api/v1/auth/reset-password` — reset a password using the emailed token.

Login and password-reset endpoints are rate-limited. Registration validates name, unique email, confirmed password, accepted terms, and the password strength already represented by the frontend. Local development may use Laravel's log mailer; production mail delivery is configuration rather than application logic.

### Account

- `PATCH /api/v1/account/profile` — update name and email.
- `PUT /api/v1/account/password` — change password using current password, new password, and confirmation.

Profile and password changes are separate so passwords are never read back into the settings form.

### Dashboard

- `GET /api/v1/dashboard` — user name, document/conversation/message counts, stored-byte total, recent conversations, recent uploads, and seven-day chat activity.

Percentage-change badges may be returned as `null` until enough historical data exists; the backend will not invent trends.

### Documents

- `GET /api/v1/documents?search=&status=&page=` — paginated user documents.
- `POST /api/v1/documents` — multipart upload of one PDF, DOCX, or TXT file.
- `GET /api/v1/documents/{document}` — details.
- `PATCH /api/v1/documents/{document}` — rename metadata while retaining the stored path.
- `DELETE /api/v1/documents/{document}` — delete database metadata and stored file transactionally as far as storage permits.
- `GET /api/v1/documents/{document}/content` — authorized inline response for the “view original” action when the file type can be displayed by the browser.
- `GET /api/v1/documents/{document}/download` — authorized download.
- `POST /api/v1/documents/{document}/reindex` — reset processing metadata and mark the document `pending` for future RAG processing.
- `GET /api/v1/uploads/recent` — recent upload summary for the upload screen.

Uploads validate extension, MIME type, and a configurable maximum size. New documents use `pending`, accurately indicating that Python indexing has not run.

### Conversations and Messages

- `GET /api/v1/conversations` — paginated conversations ordered by recent activity.
- `POST /api/v1/conversations` — create a conversation.
- `GET /api/v1/conversations/{conversation}` — conversation with ordered messages and citations.
- `PATCH /api/v1/conversations/{conversation}` — rename.
- `DELETE /api/v1/conversations/{conversation}` — delete with messages and citations.
- `POST /api/v1/conversations/{conversation}/messages` — persist a user question as `pending` and update conversation activity.

The message endpoint returns `202 Accepted` because answer generation is asynchronous/deferred. Its response clearly says RAG processing is pending. When FastAPI is implemented, a service/queue worker can submit the question and append an assistant message with citations without changing the React-facing resource shape.

## Cookie Authentication and CORS

- Configure Sanctum's stateful domains for the Vite host, normally `localhost:5173` and `127.0.0.1:5173`.
- Allow only configured frontend origins, with credentials enabled.
- Use a shared local host style consistently. Mixing `localhost` and `127.0.0.1` in browser/API URLs can prevent cookies from working as expected.
- Development cookies use appropriate local settings; production settings remain environment-driven and require HTTPS/secure cookies.
- The React client will eventually call the API with credentials enabled and request the CSRF cookie before registration/login.

## Environment Configuration

`backend/.env` will be generated from Laravel's environment template and include:

```env
APP_NAME=DocMind
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=docmind_db
DB_USERNAME=postgres
DB_PASSWORD=root

SESSION_DRIVER=database
SESSION_DOMAIN=null
SANCTUM_STATEFUL_DOMAINS=localhost:5173,127.0.0.1:5173

FASTAPI_BASE_URL=http://127.0.0.1:8001
FASTAPI_TIMEOUT=30
```

`APP_KEY` is generated during setup. `.env` remains ignored by Git; `.env.example` contains non-secret placeholders and all required keys.

## Error Handling

- API exceptions return JSON rather than redirects or HTML.
- Validation errors identify fields and messages.
- Missing or unauthorized resources return `404` without leaking ownership.
- Storage failures leave a clear server error log and avoid claiming successful upload/deletion.
- Deferred RAG operations remain visibly `pending`; the API never fabricates completion.

## Security

- Passwords use Laravel hashing and are never serialized.
- Stateful routes require session authentication and CSRF protection.
- Login and upload/message actions are rate-limited.
- Every resource query and policy is user-scoped.
- Uploaded files are kept off the public web path and served only after authorization.
- File validation uses both allowed extensions and server-observed MIME types.
- Mass assignment is restricted to explicit model fields.
- Future FastAPI credentials and URLs remain server-side.

## Testing and Verification

- Use Laravel feature tests with an isolated test database (SQLite in-memory unless PostgreSQL-specific behavior requires a PostgreSQL test database).
- Test registration, login, logout, CSRF-compatible session behavior, validation, and unauthenticated rejection.
- Test profile and password updates.
- Test document upload, listing/search, details, rename, download, delete, reindex, file validation, and cross-user denial.
- Test conversation CRUD, pending user messages, citations serialization, and cross-user denial.
- Test dashboard counts, storage totals, recents, and seven-day activity.
- Run formatting, the full test suite, migrations against `docmind_db`, and route inspection.

## Implementation Boundaries Left to the Builder

- Use the current stable Laravel release supported by the installed toolchain.
- Follow generated Laravel conventions unless this design specifies otherwise.
- Choose concise class names and resource representations that preserve the frontend fields described above.
- Keep FastAPI behind an interface so its eventual request/response contract can be added without changing controllers.
