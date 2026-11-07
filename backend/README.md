# DocMind Laravel API

Laravel 13 REST backend for DocMind. It provides Sanctum cookie authentication, account management, private document storage, conversations, pending questions, citations, and dashboard aggregates. Actual RAG processing remains deferred behind the `RagGateway` contract until the FastAPI service is implemented.

## Prerequisites

- PHP 8.3 or newer with PostgreSQL and file-info extensions
- Composer
- PostgreSQL
- An existing or new PostgreSQL database named `docmind_db`

## Local setup

From `backend/`:

```bash
composer install
cp .env.example .env
php artisan key:generate
```

Create `docmind_db` in PostgreSQL, then set your local credentials in `.env`:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=docmind_db
DB_USERNAME=postgres
DB_PASSWORD=your-local-password
```

Apply migrations and start the API:

```bash
php artisan migrate
php artisan serve
```

The default API URL is `http://localhost:8000`; application routes are under `/api/v1`.

> The migrations adopt and extend manually managed DocMind tables. Do not use `migrate:fresh`, `db:wipe`, or destructive reset commands against a database containing data.

## SPA cookie authentication

The React client must send credentialed requests and use the same host style consistently (`localhost` or `127.0.0.1`):

1. Request `GET /sanctum/csrf-cookie` with credentials enabled.
2. Send registration or login to `/api/v1/auth/register` or `/api/v1/auth/login` with credentials enabled.
3. Continue sending credentials on authenticated API requests.
4. Send `POST /api/v1/auth/logout` to invalidate the session.

The allowed frontend origins and stateful domains are configured through `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, and `SANCTUM_STATEFUL_DOMAINS`.

## Documents and storage

Uploads accept PDF, DOCX, and TXT files up to `DOCMIND_UPLOAD_MAX_KB`. Files are written to Laravel's private `local` disk under `storage/app/private/documents/...`; they are never exposed by a public storage link. Authorized content and download endpoints stream files through Laravel.

New uploads and user questions remain `pending`. The backend does not fabricate assistant answers while RAG processing is unavailable.

## Deferred FastAPI integration

`PendingRagGateway` is the current `RagGateway` implementation. A future FastAPI adapter can use:

```env
FASTAPI_BASE_URL=http://127.0.0.1:8001
FASTAPI_TIMEOUT=30
```

Replacing the gateway binding will not require changing the React-facing conversation or message resources.

## Tests and inspection

Tests use an isolated in-memory SQLite database and fake private storage where needed:

```bash
php artisan test
vendor/bin/pint --format agent
php artisan route:list --path=api/v1 --except-vendor
php artisan migrate:status --database=pgsql
```

For password-reset development, the default `log` mailer writes reset messages to the application log. Configure a production mail transport through environment variables when deploying.
