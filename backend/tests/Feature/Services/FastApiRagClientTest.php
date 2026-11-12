<?php

namespace Tests\Feature\Services;

use App\Services\FastApiRagClient;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class FastApiRagClientTest extends TestCase
{
    public function test_delete_index_sends_the_user_id_as_a_query_parameter(): void
    {
        config([
            'docmind.fastapi.base_url' => 'http://rag.test',
            'docmind.fastapi.internal_token' => 'test-token',
        ]);
        Http::preventStrayRequests();
        Http::fake([
            'http://rag.test/internal/v1/documents/doc-1*' => Http::response(null, 204),
        ]);

        app(FastApiRagClient::class)->deleteIndex('user-1', 'doc-1');

        Http::assertSent(fn ($request): bool => $request->method() === 'DELETE'
            && $request->url() === 'http://rag.test/internal/v1/documents/doc-1?user_id=user-1'
            && $request->hasHeader('X-Internal-Token', 'test-token'));
    }
}
