<?php

namespace Tests\Unit;

use App\Support\DocumentIndexFailureMessage;
use GuzzleHttp\Psr7\Response as Psr7Response;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\Response;
use PHPUnit\Framework\TestCase;
use RuntimeException;

class DocumentIndexFailureMessageTest extends TestCase
{
    public function test_connection_failures_explain_whether_the_service_is_slow_or_unavailable(): void
    {
        $this->assertSame(
            'Indexing took too long. Please try again.',
            DocumentIndexFailureMessage::from(new ConnectionException('Operation timed out')),
        );
        $this->assertSame(
            'The indexing service is unavailable. Please try again.',
            DocumentIndexFailureMessage::from(new ConnectionException('Connection refused private-host')),
        );
    }

    public function test_http_failures_are_translated_without_exposing_provider_details(): void
    {
        $this->assertSame(
            'The indexing service could not authenticate. Please contact support.',
            DocumentIndexFailureMessage::from($this->requestException(401, 'Bearer private-secret')),
        );
        $this->assertSame(
            'This document could not be read. It may be empty, damaged, or unsupported.',
            DocumentIndexFailureMessage::from($this->requestException(422, 'private source text')),
        );
        $this->assertSame(
            'The indexing service could not process this document. Please try again.',
            DocumentIndexFailureMessage::from($this->requestException(500, 'provider stack trace')),
        );
    }

    public function test_missing_service_configuration_has_an_actionable_message(): void
    {
        $this->assertSame(
            'The indexing service is not configured. Please contact support.',
            DocumentIndexFailureMessage::from(new RuntimeException('FastAPI internal token is not configured.')),
        );
    }

    private function requestException(int $status, string $body): RequestException
    {
        return new RequestException(new Response(new Psr7Response($status, [], $body)));
    }
}
