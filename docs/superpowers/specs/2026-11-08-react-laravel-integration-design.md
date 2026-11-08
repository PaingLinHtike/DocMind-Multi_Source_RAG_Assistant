# React–Laravel Integration Design

## Goal

Connect the existing React/Vite interface to the Laravel 13 REST API and replace browser-only prototype state with persistent, authenticated server data.

## Architecture

The frontend will use a dependency-free `fetch` client configured by `VITE_API_URL` (default `http://localhost:8000`). Every request includes credentials. Unsafe requests lazily initialize Laravel Sanctum through `/sanctum/csrf-cookie`, copy the `XSRF-TOKEN` cookie into `X-XSRF-TOKEN`, and retry once after a `419` response.

Feature API modules will expose authentication, dashboard, document, conversation, and account operations. React providers and hooks own UI state, loading, errors, and mutation refreshes; pages remain presentation-oriented and retain the current visual design.

## Authentication

- On startup, `AuthProvider` requests `/api/v1/auth/user` before route guards decide whether to redirect.
- Sign-in and registration use Laravel's real endpoints and store no authentication marker in browser storage.
- Registration sends `name`, lowercase `email`, `password`, `password_confirmation`, and `terms_accepted`.
- Logout invalidates the backend session and clears the in-memory user.
- A `401` from authenticated API work clears the in-memory session and returns the user to sign-in.
- Forgot password submits the email already entered on the sign-in form. A reset-password screen is deferred because the existing UI has no reset route.

## Dashboard

`/api/v1/dashboard` supplies the greeting name, metrics, seven-day activity, and recent conversations. The page renders loading, failure, empty, and populated states without fallback mock data.

## Documents and uploads

- The document list and detail screens use `/api/v1/documents` and preserve client-side filename filtering for immediate search.
- Upload uses multipart `FormData` and retains client-side extension checks while displaying server validation errors.
- Recent uploads come from `/api/v1/uploads/recent`.
- Rename, delete, and reindex wait for successful server responses before updating visible state.
- View and download use the authenticated content/download endpoints rather than fabricated feedback.
- Pagination may initially display the first API page because the current interface has no pagination controls.

## Conversations, messages, and citations

- The conversation list comes from `/api/v1/conversations`; selecting one loads its complete message thread from `/api/v1/conversations/{id}`.
- New, rename, and delete operations are persisted before local state changes.
- Sending a question posts `content` and renders the returned user message with its real `pending` status.
- No assistant response is synthesized while FastAPI/RAG is unavailable.
- Existing completed assistant messages render every returned citation, including document name, page number, and snippet when available.

## Account settings

- Name and email are initialized from the authenticated user and updated through `/api/v1/account/profile`.
- Password changes use a separate form with `current_password`, `password`, and `password_confirmation` through `/api/v1/account/password`.
- No password is prefilled or persisted in `localStorage`.

## Error and accessibility behavior

The API client normalizes Laravel response messages and field errors in an `ApiError`. Forms disable duplicate submissions, expose field/server errors through existing accessible controls, and announce success/failure. Network errors receive a stable user-facing message. Initial session checks and page loads display explicit loading states. `401` and `404` retain distinct behavior: session expiry signs out, while a missing owned resource renders its not-found state.

## Configuration and verification

`frontend/.env.example` documents `VITE_API_URL=http://localhost:8000`. No HTTP or server-state dependency is added. Frontend tests mock `fetch` at the transport boundary and cover CSRF, credentials, response normalization, loading, validation, mutations, and session expiry. Completion requires frontend tests, ESLint, production build, backend tests, Pint when PHP changes exist, and browser-level cookie/CORS verification when both development servers are available.

## Out of scope

- Python/FastAPI/RAG changes.
- Fabricated assistant answers.
- A new password-reset route and token-consumption screen.
- Redesigning the existing React visual system.
- Dropping, resetting, or rewriting PostgreSQL data.
