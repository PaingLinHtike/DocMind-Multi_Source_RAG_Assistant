# React–Laravel Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the React prototype's browser-only authentication and mock feature data with the existing Laravel Sanctum API.

**Architecture:** A native `fetch` transport owns API origin, cookies, CSRF, retries, and normalized errors. Small feature API modules expose endpoint contracts, while the authentication provider and feature hooks manage async UI state without adding dependencies or changing backend behavior.

**Tech Stack:** React 19, React Router 7, Vite 8, native Fetch API, Vitest 5, Testing Library, Laravel 13 Sanctum

**Spec:** `docs/superpowers/specs/2026-11-08-react-laravel-integration-design.md`

## Global Constraints

- Use Laravel Sanctum stateful cookie authentication; never store an authentication flag or credential in `sessionStorage` or `localStorage`.
- Add no frontend dependency; use native `fetch`.
- Keep the existing visual system and responsive layout.
- Do not modify Python RAG code.
- Do not fabricate assistant answers; submitted questions remain visibly pending until backend processing exists.
- Do not drop, truncate, reset, or recreate PostgreSQL tables or data.
- Use `VITE_API_URL`, defaulting to `http://localhost:8000`.
- Treat Laravel resource envelopes as `{ data: ... }` and preserve pagination metadata where returned.

## Review Focus

- An expired CSRF cookie (`419`) must refresh once and retry the unsafe request exactly once, never loop.
- A session that expires during an authenticated feature request (`401`) must clear React auth state and redirect to sign-in.
- Laravel validation errors (`422`) must remain associated with their fields instead of collapsing into an unhelpful generic message.
- A failed mutation must not leave an optimistic document, conversation, profile, or password state that was never persisted.
- A pending question must render the user's real message and status without creating any assistant text or citation.

---

### Task 1: Sanctum-aware API transport

**Files:**
- Create: `frontend/.env.example`
- Create: `frontend/src/api/client.js`
- Create: `frontend/src/api/client.test.js`

**Interfaces:**
- Produces: `ApiError extends Error` with `status`, `errors`, and `data`; `apiRequest(path, { method, body, headers, signal, responseType = 'json' } = {})`, where `responseType` is `json`, `text`, or `blob`; `resetCsrfState()` for test/session cleanup.
- Consumes: `import.meta.env.VITE_API_URL`; browser `fetch` and `document.cookie`.

- [ ] **Step 1: Write failing transport tests**

Cover: the configured origin and `credentials: 'include'`; JSON encoding and parsed resource envelopes with `{ data, meta }` preserved; `204` returning `null`; `text` and `blob` response modes; FormData without a forced content type; lazy `/sanctum/csrf-cookie` initialization for unsafe methods; decoded `XSRF-TOKEN` forwarding; concurrent unsafe requests sharing one CSRF initialization; one `419` refresh/retry; `422` field errors preserved in `ApiError`; network failures normalized to a stable message.

- [ ] **Step 2: Run the transport tests and verify RED**

Run: `npm test -- --run src/api/client.test.js`

Expected: FAIL because `src/api/client.js` does not exist.

- [ ] **Step 3: Implement the transport and environment example**

Implement `apiRequest` with safe methods `GET` and `HEAD`, one module-level CSRF promise, cookie decoding, Accept headers, JSON/FormData branching, explicit JSON/text/Blob parsing, and a private retry marker that prevents a second `419` retry. JSON responses return the parsed body unchanged so feature modules can read `body.data` without losing pagination metadata. Set `frontend/.env.example` to `VITE_API_URL=http://localhost:8000`.

- [ ] **Step 4: Run transport tests and verify GREEN**

Run: `npm test -- --run src/api/client.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/.env.example frontend/src/api/client.js frontend/src/api/client.test.js
git commit -m "feat(frontend): add Sanctum API client"
```

### Task 2: Real authentication and route hydration

**Files:**
- Create: `frontend/src/api/auth.js`
- Modify: `frontend/src/auth/AuthSession.jsx`
- Modify: `frontend/src/auth/authSessionStore.js`
- Modify: `frontend/src/auth/AuthRoute.jsx`
- Modify: `frontend/src/pages/SignInPage.jsx`
- Modify: `frontend/src/pages/SignUpPage.jsx`
- Modify: `frontend/src/components/layout/TopNav.jsx`
- Modify: `frontend/src/test/renderApp.jsx`
- Modify: `frontend/src/test/setup.js`
- Modify: `frontend/src/test/auth-session.test.jsx`
- Modify: `frontend/src/test/auth-routes.test.jsx`
- Modify: `frontend/src/test/signin.test.jsx`
- Modify: `frontend/src/test/signup.test.jsx`

**Interfaces:**
- Consumes: Task 1 `apiRequest` and `ApiError`.
- Produces: `getCurrentUser()`, `login(credentials)`, `register(fields)`, `logout()`, `requestPasswordReset(email)`; auth context `{ user, authenticated, initializing, login, register, logout, refreshUser, handleUnauthorized }`.

- [ ] **Step 1: Rewrite auth tests for server sessions**

Assert: route guards display a loading state until `/auth/user` resolves; `401` hydrates a guest without an alert; a valid user hydrates protected routes; sign-in sends lowercase email and password then navigates; invalid credentials render Laravel's email error; registration sends `password_confirmation` and `terms_accepted` and enters the authenticated app; forgot-password sends the entered email; logout calls the API and returns to sign-in; no test reads or writes the old storage key.

- [ ] **Step 2: Run auth tests and verify RED**

Run: `npm test -- --run src/test/auth-session.test.jsx src/test/auth-routes.test.jsx src/test/signin.test.jsx src/test/signup.test.jsx`

Expected: FAIL because current code uses prototype credentials and storage.

- [ ] **Step 3: Implement feature API functions and auth provider**

Map endpoints exactly: `GET /api/v1/auth/user`, `POST /api/v1/auth/login`, `POST /api/v1/auth/register`, `POST /api/v1/auth/logout`, and `POST /api/v1/auth/forgot-password`. Keep user state in memory, distinguish initial `401` from other failures, and expose one unauthorized handler for feature requests.

- [ ] **Step 4: Connect auth pages, guards, and top navigation**

Make handlers async, disable duplicate submissions, map Laravel field errors to controls, replace demo copy, submit forgot-password only when a valid email is present, and await logout. Update `renderApp` to arrange fetch responses instead of browser storage and reset transport state after tests.

- [ ] **Step 5: Run auth tests and verify GREEN**

Run: `npm test -- --run src/test/auth-session.test.jsx src/test/auth-routes.test.jsx src/test/signin.test.jsx src/test/signup.test.jsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/api/auth.js frontend/src/auth frontend/src/pages/SignInPage.jsx frontend/src/pages/SignUpPage.jsx frontend/src/components/layout/TopNav.jsx frontend/src/test
git commit -m "feat(frontend): connect Sanctum authentication"
```

### Task 3: Dashboard data

**Files:**
- Create: `frontend/src/api/dashboard.js`
- Modify: `frontend/src/pages/DashboardPage.jsx`
- Modify: `frontend/src/test/dashboard.test.jsx`

**Interfaces:**
- Consumes: Task 1 `apiRequest`; Task 2 `user` and `handleUnauthorized` from auth context.
- Produces: `getDashboard({ signal })`; a dashboard page driven only by Laravel data.

- [ ] **Step 1: Rewrite dashboard tests**

Assert loading, greeting from `data.user.name`, all metrics, seven activity values, recent conversation rows, empty recent conversations, retryable non-auth failure, and `401` invoking session-expiry behavior.

- [ ] **Step 2: Run dashboard tests and verify RED**

Run: `npm test -- --run src/test/dashboard.test.jsx`

Expected: FAIL because the page imports mock data.

- [ ] **Step 3: Implement dashboard loading and rendering**

Map `GET /api/v1/dashboard`; abort on unmount; render the backend's metrics, activity series, and recent conversations without importing `mockData.js`. Preserve the existing cards and chart shell, adding proportional activity bars with accessible labels.

- [ ] **Step 4: Run dashboard tests and verify GREEN**

Run: `npm test -- --run src/test/dashboard.test.jsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/api/dashboard.js frontend/src/pages/DashboardPage.jsx frontend/src/test/dashboard.test.jsx
git commit -m "feat(frontend): load dashboard from Laravel"
```

### Task 4: Documents and document actions

**Files:**
- Create: `frontend/src/api/documents.js`
- Create: `frontend/src/hooks/useDocuments.js`
- Modify: `frontend/src/pages/DocumentsPage.jsx`
- Modify: `frontend/src/pages/DocumentDetailsPage.jsx`
- Modify: `frontend/src/components/documents/DocumentRow.jsx`
- Modify: `frontend/src/components/documents/DocumentActions.jsx`
- Modify: `frontend/src/test/documents.test.jsx`
- Delete: `frontend/src/hooks/useDocumentsPrototype.js`

**Interfaces:**
- Consumes: Task 1 `apiRequest`; Task 2 unauthorized handler.
- Produces: `listDocuments({ signal })`, `getDocument(id, { signal })`, `renameDocument(id, name)`, `deleteDocument(id)`, `reindexDocument(id)`, `getDocumentContent(id)`, `downloadDocument(id)`; `useDocuments()` with collection/loading/error/refetch and mutation methods.

- [ ] **Step 1: Rewrite document tests**

Assert collection loading, client-side search, empty and failure states, direct detail loading, `404` not found, server-backed rename/reindex/delete, failed mutations retaining prior UI, authenticated content view, authenticated Blob download, and `401` session expiry.

- [ ] **Step 2: Run document tests and verify RED**

Run: `npm test -- --run src/test/documents.test.jsx`

Expected: FAIL because pages use isolated prototype arrays.

- [ ] **Step 3: Implement the document API and hook**

Map collection/resource endpoints, use `{ name }` for rename, and request both protected content and downloads with `responseType: 'blob'`. Normalize API fields at the page boundary only where existing components require camelCase display names.

- [ ] **Step 4: Connect list and detail pages**

Wait for successful mutations before replacing/removing data and navigate back to documents after successful delete. For View, create an object URL from the content Blob, open it in a new tab, and revoke it after the browser receives it; for Download, create a temporary anchor with an object URL and `download` set to `document.name`, click it, then revoke and remove it. Remove the prototype hook.

- [ ] **Step 5: Run document and transport tests and verify GREEN**

Run: `npm test -- --run src/api/client.test.js src/test/documents.test.jsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/api frontend/src/hooks/useDocuments.js frontend/src/pages/DocumentsPage.jsx frontend/src/pages/DocumentDetailsPage.jsx frontend/src/components/documents frontend/src/test/documents.test.jsx
git rm frontend/src/hooks/useDocumentsPrototype.js
git commit -m "feat(frontend): connect document management"
```

### Task 5: Real uploads and recent uploads

**Files:**
- Modify: `frontend/src/api/documents.js`
- Modify: `frontend/src/pages/UploadPage.jsx`
- Modify: `frontend/src/test/upload-settings.test.jsx`

**Interfaces:**
- Consumes: Task 4 document API module.
- Produces: `uploadDocument(file)`, `listRecentUploads({ signal })`; upload page with persistent recent data.

- [ ] **Step 1: Rewrite upload tests**

Assert recent uploads load from Laravel, valid PDF/DOCX/TXT selection posts `FormData` under `document`, the created pending document appears after success, duplicate submission is disabled, client extension rejection sends no request, `422` displays the document field error, network failure does not add a fake upload, and `401` expires the session.

- [ ] **Step 2: Run upload tests and verify RED**

Run: `npm test -- --run src/test/upload-settings.test.jsx -t "Upload Document"`

Expected: FAIL because uploads use a timer and hard-coded recent data.

- [ ] **Step 3: Implement upload endpoints and page state**

Map `POST /api/v1/documents` with FormData and `GET /api/v1/uploads/recent`. Remove initial mock uploads and completion timers; retain extension validation and show the backend's real status label.

- [ ] **Step 4: Run upload tests and verify GREEN**

Run: `npm test -- --run src/test/upload-settings.test.jsx -t "Upload Document"`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/api/documents.js frontend/src/pages/UploadPage.jsx frontend/src/test/upload-settings.test.jsx
git commit -m "feat(frontend): persist document uploads"
```

### Task 6: Conversations, pending messages, and citations

**Files:**
- Create: `frontend/src/api/conversations.js`
- Create: `frontend/src/hooks/useConversations.js`
- Modify: `frontend/src/pages/ChatPage.jsx`
- Modify: `frontend/src/test/chat.test.jsx`
- Delete: `frontend/src/hooks/useChatPrototype.js`

**Interfaces:**
- Consumes: Task 1 transport; Task 2 unauthorized handler.
- Produces: `listConversations({ signal })`, `getConversation(id, { signal })`, `createConversation(title?)`, `renameConversation(id, title)`, `deleteConversation(id)`, `sendMessage(id, content)`; `useConversations()` with list, selected thread, loading/error, and persisted mutations.

- [ ] **Step 1: Rewrite chat tests**

Assert list loading and first-thread selection, empty account state, explicit new-chat persistence, lazy thread loading, persisted rename/delete, failed mutations retaining prior UI, submitted content rendering exactly one pending user message, no synthesized assistant message, completed assistant messages rendering all citations, and `401` expiring the session.

- [ ] **Step 2: Run chat tests and verify RED**

Run: `npm test -- --run src/test/chat.test.jsx`

Expected: FAIL because the page uses mock conversations and fabricates an answer.

- [ ] **Step 3: Implement conversation API and state hook**

Map REST endpoints and `POST /api/v1/conversations/{id}/messages` with `{ content }`. Treat collection resources as summaries and `GET` resources as authoritative threads. Serialize selection requests with AbortController or request identity so a slower prior selection cannot replace the current thread.

- [ ] **Step 4: Connect chat UI**

Remove assumptions that an active conversation always exists, disable the composer without a selected conversation or during submission, render `message.content`, show pending status, render a list of `message.citations`, and never create assistant content locally. Remove the prototype hook.

- [ ] **Step 5: Run chat tests and verify GREEN**

Run: `npm test -- --run src/test/chat.test.jsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/api/conversations.js frontend/src/hooks/useConversations.js frontend/src/pages/ChatPage.jsx frontend/src/test/chat.test.jsx
git rm frontend/src/hooks/useChatPrototype.js
git commit -m "feat(frontend): connect conversations and messages"
```

### Task 7: Secure account settings and full integration verification

**Files:**
- Create: `frontend/src/api/account.js`
- Modify: `frontend/src/pages/SettingsPage.jsx`
- Modify: `frontend/src/test/upload-settings.test.jsx`
- Modify: `frontend/src/test/setup.js`
- Modify as required: frontend tests that still import mock/session behavior
- Delete when unused: `frontend/src/data/mockData.js`

**Interfaces:**
- Consumes: Task 1 transport and `ApiError`; Task 2 auth `user`, `refreshUser`, and unauthorized handler.
- Produces: `updateProfile({ name, email })`, `updatePassword({ currentPassword, password, passwordConfirmation })`; server-backed settings forms.

- [ ] **Step 1: Rewrite settings tests**

Assert profile fields initialize from the authenticated user; profile update sends lowercase email and refreshes auth user only after success; duplicate/invalid email maps to the email field; password inputs begin empty; password update sends all three backend field names; wrong current password maps to its field; successful password change clears all password inputs; no password or account object is read from or written to localStorage; failed updates retain editable values; `401` expires the session.

- [ ] **Step 2: Run settings tests and verify RED**

Run: `npm test -- --run src/test/upload-settings.test.jsx -t "Settings"`

Expected: FAIL because settings use plaintext localStorage.

- [ ] **Step 3: Implement account API and separate forms**

Map `PATCH /api/v1/account/profile` and `PUT /api/v1/account/password`; translate camelCase parameters to `current_password` and `password_confirmation`. Keep profile and password pending/error/success state independent and preserve existing accessible styling.

- [ ] **Step 4: Run settings tests and verify GREEN**

Run: `npm test -- --run src/test/upload-settings.test.jsx -t "Settings"`

Expected: PASS.

- [ ] **Step 5: Remove remaining mock integration and run frontend verification**

Search: `rg "mockData|Prototype|sessionStorage|docmind.account-settings" frontend/src`

Expected: no application-code matches; test-only storage cleanup is acceptable. Delete `mockData.js` if no visual/test fixture still imports it.

Run:

```bash
cd frontend
npm test -- --run
npm run lint
npm run build
```

Expected: all tests pass, ESLint exits 0, and Vite production build succeeds.

- [ ] **Step 6: Run backend regression verification**

Run:

```bash
cd backend
php artisan test --compact
vendor/bin/pint --dirty --format agent
```

Expected: all backend tests pass and Pint reports success. No PHP file should require modification for this plan.

- [ ] **Step 7: Perform browser cookie/CORS smoke verification**

With Laravel at `http://localhost:8000` and Vite at `http://localhost:5173`, verify registration or sign-in, session persistence after refresh, dashboard load, one upload, one conversation/question showing pending, settings profile update, logout, and no credentialed CORS/CSRF errors in the browser console. Do not alter existing PostgreSQL records except through these user-visible test actions.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/api/account.js frontend/src/pages/SettingsPage.jsx frontend/src/test frontend/src/data/mockData.js
git commit -m "feat(frontend): connect account settings"
```
