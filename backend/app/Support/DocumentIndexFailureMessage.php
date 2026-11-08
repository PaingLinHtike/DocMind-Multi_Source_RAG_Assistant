<?php

namespace App\Support;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use RuntimeException;
use Throwable;

class DocumentIndexFailureMessage
{
    public static function from(Throwable $exception): string
    {
        if ($exception instanceof ConnectionException) {
            return str_contains(strtolower($exception->getMessage()), 'timed out')
                ? 'Indexing took too long. Please try again.'
                : 'The indexing service is unavailable. Please try again.';
        }

        if ($exception instanceof RequestException) {
            return match ($exception->response->status()) {
                401, 403 => 'The indexing service could not authenticate. Please contact support.',
                422 => 'This document could not be read. It may be empty, damaged, or unsupported.',
                default => 'The indexing service could not process this document. Please try again.',
            };
        }

        if ($exception instanceof RuntimeException
            && $exception->getMessage() === 'FastAPI internal token is not configured.') {
            return 'The indexing service is not configured. Please contact support.';
        }

        return 'Document indexing failed. Please try again.';
    }
}
