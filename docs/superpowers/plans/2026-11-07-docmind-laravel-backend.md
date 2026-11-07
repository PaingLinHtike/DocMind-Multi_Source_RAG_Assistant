# DocMind Laravel Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Laravel REST API in `backend/` that persists and secures all data needed by the existing DocMind React screens while leaving RAG execution pending for a future FastAPI service.

**Architecture:** Laravel owns stateful Sanctum SPA sessions, PostgreSQL records, private uploads, authorization, and versioned JSON resources. Controllers delegate validation and domain work to focused requests/services; Eloquent policies enforce user ownership. A `RagGateway` interface provides the future Python seam, with a pending implementation that never fabricates answers.

**Tech Stack:** Current stable Laravel, PHP 8.5, Laravel Sanctum, PostgreSQL 17, PHPUnit, Laravel HTTP/file-storage/testing facilities

**Spec:** `docs/superpowers/specs/2026-11-07-docmind-laravel-backend-design.md`

## Global Constraints

- Build only in `backend/`; do not modify React or Python RAG code.
- PostgreSQL is `127.0.0.1:5432`, database `docmind_db`, username `postgres`; the supplied password belongs only in ignored `backend/.env`.
- All application JSON endpoints live under `/api/v1`; Sanctum's CSRF endpoint remains `/sanctum/csrf-cookie`.
- Use Sanctum stateful cookie authentication, credentialed CORS, database sessions, and CSRF protection.
- Public resource identifiers are UUIDs; every user-owned query is scoped and cross-user access returns `404`.
- Private uploads accept only PDF, DOCX, and TXT, up to configurable `20480` KiB.
- Questions remain `pending` until FastAPI exists; never create a fake assistant answer.
- `.env` is ignored; `.env.example` contains placeholders only.
- Follow TDD after framework scaffolding and commit each completed task independently.

## Review Focus

- A valid session from an untrusted origin must not gain credentialed CORS access; Task 1 pins allowed origins and credentials configuration.
- Login must regenerate the session and logout must invalidate it; Task 2 verifies both transitions.
- A renamed or spoofed upload with an unsupported extension/MIME pair must be rejected and leave no file behind; Task 3 tests both validation and storage cleanup.
- UUID guessing must not reveal another user's document or conversation; Tasks 3 and 4 assert `404` across read, update, delete, and nested message actions.
- Concurrent/deferred RAG behavior must not create assistant text or mark a question complete; Task 4 asserts exactly one pending user message and no assistant message.

---

## File Structure

Generated Laravel framework files remain conventional. The implementation adds these focused units:

- `backend/config/docmind.php` — frontend origin, upload limit, and future FastAPI settings.
- `backend/routes/api.php` — `/api/v1` public/authenticated route groups.
- `backend/app/Http/Controllers/Api/V1/Auth/*` — registration, session, and password-reset endpoints.
- `backend/app/Http/Controllers/Api/V1/Account/*` — profile and password changes.
- `backend/app/Http/Controllers/Api/V1/DocumentController.php` plus content/reindex/recent controllers — document actions.
- `backend/app/Http/Controllers/Api/V1/ConversationController.php` and `ConversationMessageController.php` — chat persistence.
- `backend/app/Http/Controllers/Api/V1/DashboardController.php` — aggregate screen payload.
- `backend/app/Http/Requests/Api/V1/*` — endpoint validation and authorization.
- `backend/app/Http/Resources/Api/V1/*` — stable JSON representations.
- `backend/app/Models/{Document,Conversation,Message,Citation}.php` — relationships, UUIDs, casts, and allowed fields.
- `backend/app/Policies/{Document,Conversation}Policy.php` — ownership authorization.
- `backend/app/Contracts/RagGateway.php`, `backend/app/Data/RagDispatchResult.php`, and `backend/app/Services/{PendingRagGateway,SubmitQuestion}.php` — deferred Python boundary.
- `backend/database/migrations/*` — sessions and DocMind tables.
- `backend/database/factories/*` — test fixtures.
- `backend/tests/Feature/Api/V1/*` — behavior and security coverage.

### Task 1: Scaffold Laravel and configure the SPA/API foundation

**Files:**
- Replace: `backend/.env` (currently empty and approved for replacement)
- Create: generated Laravel application under `backend/`
- Modify: `backend/bootstrap/app.php`
- Modify: `backend/config/cors.php`
- Create: `backend/config/docmind.php`
- Modify: `backend/.env.example`
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/Api/V1/InfrastructureTest.php`

**Interfaces:**
- Consumes: PostgreSQL and frontend values in Global Constraints.
- Produces: stateful API middleware; `GET /api/v1/health -> 200 {data:{status:"ok"}}`; `config('docmind.frontend_url')`, `config('docmind.upload_max_kb')`, `config('docmind.fastapi.*')`.

- [ ] **Step 1: Scaffold the framework and API support**

Remove only the empty `backend/.env`, run `composer create-project laravel/laravel backend`, then run `php artisan install:api` from `backend/`. Keep the generated stable Laravel version and Sanctum dependency in `composer.lock`.

- [ ] **Step 2: Write the failing infrastructure tests**

Create tests named `health_endpoint_returns_json`, `cors_allows_only_configured_frontend_origins_with_credentials`, and `docmind_configuration_has_safe_defaults`. Assert:

```php
$this->getJson('/api/v1/health')->assertOk()->assertExactJson(['data' => ['status' => 'ok']]);
$this->assertSame(['http://localhost:5173', 'http://127.0.0.1:5173'], config('cors.allowed_origins'));
$this->assertTrue(config('cors.supports_credentials'));
$this->assertSame(20480, config('docmind.upload_max_kb'));
$this->assertSame('http://127.0.0.1:8001', config('docmind.fastapi.base_url'));
$this->withHeaders(['Origin' => 'http://localhost:5173'])->options('/api/v1/health')->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173')->assertHeader('Access-Control-Allow-Credentials', 'true');
$this->withHeaders(['Origin' => 'https://untrusted.example'])->options('/api/v1/health')->assertHeaderMissing('Access-Control-Allow-Origin');
```

- [ ] **Step 3: Run the focused test and verify failure**

Run: `php artisan test tests/Feature/Api/V1/InfrastructureTest.php`

Expected: FAIL because the route and DocMind/CORS configuration are absent.

- [ ] **Step 4: Configure stateful API middleware and environment**

Enable `statefulApi()` in `bootstrap/app.php`; force JSON rendering for `/api/*`; define the health route; set CORS paths to `api/*` and `sanctum/csrf-cookie`, configured origins only, and credentials true. Create `config/docmind.php` with `frontend_url: string`, `upload_max_kb: int`, and `fastapi: array{base_url:string,timeout:int}`.

Create ignored `.env` with `APP_NAME=DocMind`, generated `APP_KEY`, the approved PostgreSQL credentials, `SESSION_DRIVER=database`, `SESSION_DOMAIN=null`, and both local Sanctum stateful domains. Put password-free placeholders in `.env.example`.

- [ ] **Step 5: Create and migrate `docmind_db`**

Use PostgreSQL tooling to create `docmind_db` only if it does not exist, then run `php artisan migrate`. Do not drop or recreate an existing database.

Expected: migrations complete successfully and include the database sessions table.

- [ ] **Step 6: Run tests and inspect routes**

Run: `php artisan test tests/Feature/Api/V1/InfrastructureTest.php`

Expected: PASS.

Run: `php artisan route:list --path=api/v1`

Expected: `GET api/v1/health` is listed.

- [ ] **Step 7: Commit**

```bash
git add backend
git commit -m "feat: scaffold Laravel API foundation"
```

### Task 2: Implement cookie authentication and account management

**Files:**
- Create: `backend/app/Http/Controllers/Api/V1/Auth/RegisteredUserController.php`
- Create: `backend/app/Http/Controllers/Api/V1/Auth/AuthenticatedSessionController.php`
- Create: `backend/app/Http/Controllers/Api/V1/Auth/PasswordResetLinkController.php`
- Create: `backend/app/Http/Controllers/Api/V1/Auth/NewPasswordController.php`
- Create: `backend/app/Http/Controllers/Api/V1/Account/ProfileController.php`
- Create: `backend/app/Http/Controllers/Api/V1/Account/PasswordController.php`
- Create: `backend/app/Http/Requests/Api/V1/Auth/{RegisterRequest,LoginRequest,ForgotPasswordRequest,ResetPasswordRequest}.php`
- Create: `backend/app/Http/Requests/Api/V1/Account/{UpdateProfileRequest,UpdatePasswordRequest}.php`
- Create: `backend/app/Http/Resources/Api/V1/UserResource.php`
- Modify: `backend/app/Models/User.php`
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/Api/V1/AuthTest.php`
- Test: `backend/tests/Feature/Api/V1/AccountTest.php`

**Interfaces:**
- Consumes: stateful middleware from Task 1.
- Produces: authenticated session endpoints and `UserResource` fields `id`, `name`, `email`, `created_at`.
- Produces routes: `POST auth/register`, `POST auth/login`, `POST auth/logout`, `GET auth/user`, `POST auth/forgot-password`, `POST auth/reset-password`, `PATCH account/profile`, and `PUT account/password`, all under `/api/v1`.

- [ ] **Step 1: Write failing registration and session tests**

Test `registration_validates_terms_password_strength_and_confirmation`, `registration_creates_user_and_session`, `login_rejects_bad_credentials`, `login_regenerates_session`, `current_user_requires_authentication`, and `logout_invalidates_session`. Key assertions:

```php
$this->postJson('/api/v1/auth/register', $valid)->assertCreated()->assertJsonPath('data.email', 'aung@example.com');
$this->assertAuthenticated();
$this->postJson('/api/v1/auth/login', $credentials)->assertOk();
$this->assertNotSame($oldSessionId, session()->getId());
$this->postJson('/api/v1/auth/logout')->assertNoContent();
$this->assertGuest();
```

- [ ] **Step 2: Run auth tests and verify failure**

Run: `php artisan test tests/Feature/Api/V1/AuthTest.php`

Expected: FAIL with missing routes/classes.

- [ ] **Step 3: Implement registration, login, current-user, and logout endpoints**

Use `Auth::attempt`, session regeneration after login, session invalidation plus CSRF token regeneration on logout, Laravel's password hashing, and named rate limiters for login. Registration requires accepted `terms_accepted`, unique email, `confirmed`, and `Password::min(8)->mixedCase()->numbers()->symbols()`.

- [ ] **Step 4: Run auth tests and verify pass**

Run: `php artisan test tests/Feature/Api/V1/AuthTest.php`

Expected: registration/session tests PASS.

- [ ] **Step 5: Write failing password-reset and account tests**

Test `forgot_password_sends_reset_notification`, `reset_password_accepts_valid_token`, `profile_update_enforces_unique_email`, `password_update_requires_current_password`, and `password_update_hashes_new_password`. Use `Notification::fake()` and assert no password key exists in any user response.

- [ ] **Step 6: Run the new tests and verify failure**

Run: `php artisan test tests/Feature/Api/V1/AuthTest.php tests/Feature/Api/V1/AccountTest.php`

Expected: FAIL on missing password reset/account routes.

- [ ] **Step 7: Implement password reset, profile, and password endpoints**

Use Laravel's password broker for reset links/tokens. Define invokable profile/password controllers; profile returns `UserResource`, password returns `204`. Rate-limit reset-link requests and never reveal whether an email is registered beyond Laravel's neutral accepted response.

- [ ] **Step 8: Run focused tests**

Run: `php artisan test tests/Feature/Api/V1/AuthTest.php tests/Feature/Api/V1/AccountTest.php`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add backend/app backend/routes/api.php backend/tests
git commit -m "feat: add SPA authentication and account APIs"
```

### Task 3: Implement private document upload and management

**Files:**
- Create: `backend/database/migrations/*_create_documents_table.php`
- Create: `backend/app/Models/Document.php`
- Create: `backend/database/factories/DocumentFactory.php`
- Create: `backend/app/Policies/DocumentPolicy.php`
- Create: `backend/app/Http/Requests/Api/V1/{StoreDocumentRequest,UpdateDocumentRequest}.php`
- Create: `backend/app/Http/Resources/Api/V1/DocumentResource.php`
- Create: `backend/app/Http/Controllers/Api/V1/{DocumentController,DocumentContentController,ReindexDocumentController,RecentUploadController}.php`
- Modify: `backend/app/Models/User.php`
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/Api/V1/DocumentTest.php`

**Interfaces:**
- Consumes: authenticated user from Task 2 and `config('docmind.upload_max_kb')` from Task 1.
- Produces: `Document` UUID model; `User::documents(): HasMany`; document JSON fields `id`, `name`, `type`, `status`, `status_label`, `chunks`, `uploaded_at`, `size_bytes`, `size`, `source`, `storage`, `content_url`, `download_url`.
- Produces routes: document index/store/show/update/delete, `GET documents/{document}/content`, `GET documents/{document}/download`, `POST documents/{document}/reindex`, and `GET uploads/recent`, all under `/api/v1`.

- [ ] **Step 1: Write failing model, upload, and validation tests**

Test `authenticated_user_uploads_pdf_as_pending`, data providers for PDF/DOCX/TXT, `unsupported_extension_is_rejected`, `spoofed_extension_mime_pair_is_rejected_without_storing_file`, `oversized_file_is_rejected`, `guest_cannot_upload`, and `upload_rate_limit_returns_429`. Assert the file exists only on the private disk after a valid `201` response and `documents.user_id` equals the authenticated user.

- [ ] **Step 2: Run upload tests and verify failure**

Run: `php artisan test tests/Feature/Api/V1/DocumentTest.php --filter=upload`

Expected: FAIL with missing table/routes.

- [ ] **Step 3: Implement the document model, migration, upload request, and create endpoint**

Use `HasUuids`; define status constants (`uploaded`, `pending`, `processing`, `ready`, `failed`); store on a non-public disk under `documents/{user-id}/{document-uuid}`. Validate extension, observed MIME, and a maximum built from `(int) config('docmind.upload_max_kb')`. Apply a named `uploads` limiter. Persist metadata only after successful storage and remove a just-written file if database persistence fails.

- [ ] **Step 4: Run upload tests and verify pass**

Run: `php artisan test tests/Feature/Api/V1/DocumentTest.php --filter=upload`

Expected: PASS.

- [ ] **Step 5: Write failing document CRUD, search, content, and ownership tests**

Test paginated user-only listing, case-insensitive `search`, details, metadata rename, inline content disposition, attachment disposition, deletion of row and file, recent uploads, reindex resetting `chunk_count/failure_reason/indexed_at`, and every cross-user action returning `404` (read, rename, content, download, reindex, delete).

- [ ] **Step 6: Run CRUD tests and verify failure**

Run: `php artisan test tests/Feature/Api/V1/DocumentTest.php`

Expected: FAIL on missing behavior.

- [ ] **Step 7: Implement resources, policy, and remaining document endpoints**

Bind documents through the authenticated user's relationship (or equivalent scoped binding) before policy checks. Rename only `name`; never expose an absolute server path. Reindex sets status `pending` and clears prior processing fields. Deletion removes the database row and private file, returning `204`; log and return a JSON server error if storage deletion fails.

- [ ] **Step 8: Run all document tests**

Run: `php artisan test tests/Feature/Api/V1/DocumentTest.php`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add backend/app backend/database backend/routes/api.php backend/tests/Feature/Api/V1/DocumentTest.php
git commit -m "feat: add private document APIs"
```

### Task 4: Implement conversations, pending questions, and the RAG boundary

**Files:**
- Create: `backend/database/migrations/*_create_conversations_table.php`
- Create: `backend/database/migrations/*_create_messages_table.php`
- Create: `backend/database/migrations/*_create_citations_table.php`
- Create: `backend/app/Models/{Conversation,Message,Citation}.php`
- Create: `backend/database/factories/{ConversationFactory,MessageFactory,CitationFactory}.php`
- Create: `backend/app/Policies/ConversationPolicy.php`
- Create: `backend/app/Http/Requests/Api/V1/{StoreConversationRequest,UpdateConversationRequest,StoreMessageRequest}.php`
- Create: `backend/app/Http/Resources/Api/V1/{ConversationResource,MessageResource,CitationResource}.php`
- Create: `backend/app/Http/Controllers/Api/V1/{ConversationController,ConversationMessageController}.php`
- Create: `backend/app/Contracts/RagGateway.php`
- Create: `backend/app/Data/RagDispatchResult.php`
- Create: `backend/app/Services/{PendingRagGateway,SubmitQuestion}.php`
- Create: `backend/app/Providers/DocMindServiceProvider.php`
- Modify: `backend/bootstrap/providers.php`
- Modify: `backend/app/Models/{User,Document}.php`
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/Api/V1/ConversationTest.php`

**Interfaces:**
- Consumes: authenticated user and `Document` model from prior tasks.
- Produces: `RagGateway::dispatch(Message $message): RagDispatchResult`; `RagDispatchResult(bool $accepted, string $status)`; `SubmitQuestion::handle(User $user, Conversation $conversation, string $content): Message`; nested conversation/message/citation JSON.
- Produces routes: conversation index/store/show/update/delete and `POST conversations/{conversation}/messages`, all under `/api/v1`.

- [ ] **Step 1: Write failing conversation CRUD and ownership tests**

Test user-scoped recent ordering, default title `New Chat`, explicit title, show with messages, rename, cascade delete, and cross-user `show/update/delete` returning `404`. Assert list responses do not embed full message histories while show responses do.

- [ ] **Step 2: Run conversation tests and verify failure**

Run: `php artisan test tests/Feature/Api/V1/ConversationTest.php --filter=conversation`

Expected: FAIL with missing schema/routes.

- [ ] **Step 3: Implement conversation schema, models, resource, policy, and CRUD**

Use UUIDs, `user_id`, title max `255`, and timestamps. Order list by `updated_at DESC`. Cascade messages/citations at the database level. Scope route binding to the authenticated user's conversations.

- [ ] **Step 4: Run conversation CRUD tests**

Run: `php artisan test tests/Feature/Api/V1/ConversationTest.php --filter=conversation`

Expected: PASS.

- [ ] **Step 5: Write failing pending-message, citation, and RAG boundary tests**

Test `question_returns_202_with_one_pending_user_message`, `question_does_not_create_assistant_message`, `question_updates_conversation_activity`, `empty_or_oversized_question_is_rejected`, `message_rate_limit_returns_429`, `cross_user_cannot_post_message`, and `completed_assistant_message_serializes_ordered_citations`. Bind a fake `RagGateway` in one test and assert it receives the persisted message UUID.

- [ ] **Step 6: Run message tests and verify failure**

Run: `php artisan test tests/Feature/Api/V1/ConversationTest.php --filter=question`

Expected: FAIL with missing message service/endpoint.

- [ ] **Step 7: Implement message/citation persistence and deferred gateway**

Set message role constants `user|assistant` and status constants `pending|processing|completed|failed`. `SubmitQuestion::handle` runs in a transaction, creates exactly one pending user message, touches the conversation, invokes `RagGateway`, and does not create an assistant message. `PendingRagGateway::dispatch` returns `new RagDispatchResult(false, 'pending')`. Register that binding in `DocMindServiceProvider` and apply a named `messages` limiter to question submission.

- [ ] **Step 8: Run all conversation tests**

Run: `php artisan test tests/Feature/Api/V1/ConversationTest.php`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add backend/app backend/bootstrap/providers.php backend/database backend/routes/api.php backend/tests/Feature/Api/V1/ConversationTest.php
git commit -m "feat: add conversation and pending message APIs"
```

### Task 5: Implement dashboard aggregates

**Files:**
- Create: `backend/app/Http/Resources/Api/V1/DashboardResource.php`
- Create: `backend/app/Http/Controllers/Api/V1/DashboardController.php`
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/Api/V1/DashboardTest.php`

**Interfaces:**
- Consumes: user-owned documents, conversations, and messages from Tasks 3–4.
- Produces: `GET /api/v1/dashboard` with `user`, `metrics`, `chat_activity`, `recent_conversations`, and `recent_uploads`.

- [ ] **Step 1: Write failing dashboard tests**

Test `dashboard_returns_only_authenticated_users_aggregates`, `dashboard_counts_documents_conversations_messages_and_storage`, `dashboard_returns_seven_zero_filled_local_date_buckets`, `dashboard_orders_three_recent_conversations_and_four_uploads`, and `dashboard_trends_are_null_without_comparable_history`. Assert another user's rows never affect counts, bytes, recents, or activity.

- [ ] **Step 2: Run dashboard tests and verify failure**

Run: `php artisan test tests/Feature/Api/V1/DashboardTest.php`

Expected: FAIL with route missing.

- [ ] **Step 3: Implement the dashboard query and resource**

Return numeric metrics `{documents, conversations, messages, storage_bytes}` with each `change` set to `null` unless real comparable data is computed. Build exactly seven date buckets ending today, count user-role messages by creation date, and use the existing document/conversation resources for recents without extra queries per row.

- [ ] **Step 4: Run dashboard tests**

Run: `php artisan test tests/Feature/Api/V1/DashboardTest.php`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/app/Http backend/routes/api.php backend/tests/Feature/Api/V1/DashboardTest.php
git commit -m "feat: add dashboard API"
```

### Task 6: Document setup and perform full verification

**Files:**
- Modify: `backend/README.md`
- Modify: `backend/.env.example`
- Test: all `backend/tests`

**Interfaces:**
- Consumes: all previous tasks.
- Produces: repeatable local setup instructions and a verified route/schema/test baseline for later React and FastAPI work.

- [ ] **Step 1: Write the backend README**

Document prerequisites, `composer install`, creation of `docmind_db`, `.env` setup without a real password, `php artisan key:generate`, migrations, `php artisan serve`, cookie-auth flow (`/sanctum/csrf-cookie` then credentialed requests), tests, private storage behavior, and the deferred FastAPI variables.

- [ ] **Step 2: Verify environment examples contain every required key and no secret**

Run: `git grep -n "DB_PASSWORD=root\|APP_KEY=base64:" -- backend/.env.example backend/README.md`

Expected: no output.

- [ ] **Step 3: Format the code**

Run: `vendor/bin/pint --test`

Expected: PASS. If it reports formatting changes, run `vendor/bin/pint`, review the diff, then rerun `vendor/bin/pint --test`.

- [ ] **Step 4: Apply the configured PostgreSQL migrations without dropping existing data**

Run: `php artisan migrate --force --database=pgsql`

Expected: all pending DocMind migrations complete against the explicitly configured `docmind_db`. Run this only after confirming `.env` names `docmind_db`; never use `migrate:fresh` against an existing user database.

Run: `php artisan migrate:status --database=pgsql`

Expected: every DocMind migration reports `Ran`.

- [ ] **Step 5: Run the complete test suite**

Run: `php artisan test`

Expected: all tests PASS with no warnings or failures.

- [ ] **Step 6: Inspect API routes and configuration**

Run: `php artisan route:list --path=api/v1`

Expected: health, auth, account, dashboard, documents, uploads, conversations, and message routes are present with intended auth middleware.

Run: `php artisan config:show database`

Expected: default connection is `pgsql`; redact any password from captured output.

- [ ] **Step 7: Confirm only intended files changed**

Run: `git status --short`

Expected: backend and this task's documentation changes only; do not add existing `frontend/.opencode/` or other unrelated user files.

- [ ] **Step 8: Commit**

```bash
git add backend/README.md backend/.env.example
git commit -m "docs: add Laravel backend setup guide"
```
