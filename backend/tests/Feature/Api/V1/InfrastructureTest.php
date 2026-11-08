<?php

namespace Tests\Feature\Api\V1;

use Tests\TestCase;

class InfrastructureTest extends TestCase
{
    public function test_health_endpoint_returns_json(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response
            ->assertOk()
            ->assertExactJson(['data' => ['status' => 'ok']]);
    }

    public function test_cors_allows_only_configured_frontend_origins_with_credentials(): void
    {
        $trustedResponse = $this
            ->withHeaders(['Origin' => 'http://localhost:5173'])
            ->options('/api/v1/health');

        $trustedResponse
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
            ->assertHeader('Access-Control-Allow-Credentials', 'true');

        $untrustedResponse = $this
            ->withHeaders(['Origin' => 'https://untrusted.example'])
            ->options('/api/v1/health');

        $untrustedResponse->assertHeaderMissing('Access-Control-Allow-Origin');
    }

    public function test_docmind_configuration_has_safe_defaults(): void
    {
        $this->assertSame(
            ['http://localhost:5173', 'http://127.0.0.1:5173'],
            config('cors.allowed_origins'),
        );
        $this->assertTrue(config('cors.supports_credentials'));
        $this->assertSame(20480, config('docmind.upload_max_kb'));
        $this->assertSame('http://127.0.0.1:8001', config('docmind.fastapi.base_url'));
    }
}
