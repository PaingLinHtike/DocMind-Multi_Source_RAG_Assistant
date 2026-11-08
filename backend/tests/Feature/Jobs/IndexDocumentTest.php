<?php

namespace Tests\Feature\Jobs;

use App\Jobs\IndexDocument;
use App\Models\Document;
use App\Services\FastApiRagClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\TestCase;

class IndexDocumentTest extends TestCase
{
    use RefreshDatabase;

    public function test_job_indexes_stored_document_and_records_metadata(): void
    {
        config(['docmind.fastapi.internal_token' => 'test-token']);
        Storage::fake('local');
        Http::preventStrayRequests();
        Http::fake([
            '*/internal/v1/documents/index' => Http::response([
                'chunk_count' => 3,
                'collection' => 'docmind',
                'embedding_model' => 'intfloat/e5-base-v2',
            ]),
        ]);
        $runId = (string) Str::uuid();
        $document = Document::factory()->create([
            'storage_key' => 'documents/source.txt',
            'status' => Document::StatusPending,
            'rag_stage' => 'queued',
            'index_run_id' => $runId,
        ]);
        Storage::disk('local')->put($document->storage_key, 'index me');

        (new IndexDocument($document->id, $runId))->handle(app(FastApiRagClient::class));

        $document->refresh();
        $this->assertSame(Document::StatusReady, $document->status);
        $this->assertSame('ready', $document->rag_stage);
        $this->assertSame(3, $document->chunk_count);
        $this->assertSame('intfloat/e5-base-v2', $document->embedding_model);
        $this->assertNotNull($document->indexed_at);
        $this->assertNull($document->index_run_id);
        Http::assertSent(fn ($request): bool => str_contains($request->body(), 'run_id')
            && str_contains($request->body(), $runId));
    }

    public function test_stale_job_does_not_start_indexing(): void
    {
        config(['docmind.fastapi.internal_token' => 'test-token']);
        Http::preventStrayRequests();
        $document = Document::factory()->create([
            'status' => Document::StatusUploaded,
            'rag_stage' => 'uploaded',
            'index_run_id' => null,
        ]);

        (new IndexDocument($document->id, (string) Str::uuid()))->handle(app(FastApiRagClient::class));

        $this->assertSame(Document::StatusUploaded, $document->refresh()->status);
        Http::assertNothingSent();
    }

    public function test_job_discards_a_result_when_the_run_was_stopped_during_indexing(): void
    {
        config(['docmind.fastapi.internal_token' => 'test-token']);
        Storage::fake('local');
        $runId = (string) Str::uuid();
        $document = Document::factory()->create([
            'storage_key' => 'documents/source.txt',
            'status' => Document::StatusPending,
            'rag_stage' => 'queued',
            'index_run_id' => $runId,
        ]);
        Storage::disk('local')->put($document->storage_key, 'index me');
        Http::preventStrayRequests();
        Http::fake([
            '*/internal/v1/documents/index' => function () use ($document) {
                $document->update([
                    'status' => Document::StatusUploaded,
                    'rag_stage' => 'uploaded',
                    'index_run_id' => null,
                ]);

                return Http::response([
                    'chunk_count' => 3,
                    'collection' => 'docmind',
                    'embedding_model' => 'intfloat/e5-base-v2',
                ]);
            },
            "*/internal/v1/documents/{$document->id}*" => Http::response(null, 204),
        ]);

        (new IndexDocument($document->id, $runId))->handle(app(FastApiRagClient::class));

        $document->refresh();
        $this->assertSame(Document::StatusUploaded, $document->status);
        $this->assertNull($document->indexed_at);
        Http::assertSent(fn ($request): bool => $request->method() === 'DELETE'
            && str_contains($request->url(), "/internal/v1/documents/{$document->id}"));
    }

    public function test_terminal_failure_is_recorded_only_for_the_current_run_without_secrets(): void
    {
        $runId = (string) Str::uuid();
        $document = Document::factory()->create([
            'status' => Document::StatusProcessing,
            'rag_stage' => 'embedding',
            'index_run_id' => $runId,
        ]);

        (new IndexDocument($document->id, $runId))->failed(new RuntimeException('Bearer private-secret'));

        $document->refresh();
        $this->assertSame(Document::StatusFailed, $document->status);
        $this->assertSame('failed', $document->rag_stage);
        $this->assertSame('Document indexing failed. Please try again.', $document->failure_reason);
        $this->assertStringNotContainsString('private-secret', $document->failure_reason);
        $this->assertNull($document->index_run_id);
    }

    public function test_terminal_failure_does_not_change_a_stopped_run(): void
    {
        $document = Document::factory()->create([
            'status' => Document::StatusUploaded,
            'rag_stage' => 'uploaded',
            'index_run_id' => null,
        ]);

        (new IndexDocument($document->id, (string) Str::uuid()))->failed(new RuntimeException('private-secret'));

        $document->refresh();
        $this->assertSame(Document::StatusUploaded, $document->status);
        $this->assertNull($document->failure_reason);
    }
}
