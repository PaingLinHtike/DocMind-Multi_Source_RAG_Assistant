<?php

namespace Tests\Feature\Jobs;

use App\Jobs\IndexDocument;
use App\Models\Document;
use App\Services\FastApiRagClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class IndexDocumentTest extends TestCase
{
    use RefreshDatabase;

    public function test_job_indexes_stored_document_and_records_metadata(): void
    {
        config(['docmind.fastapi.internal_token' => 'test-token']);
        Storage::fake('local');
        Http::fake([
            '*/internal/v1/documents/index' => Http::response([
                'chunk_count' => 3,
                'collection' => 'docmind',
                'embedding_model' => 'intfloat/e5-base-v2',
            ]),
        ]);
        $document = Document::factory()->create(['storage_key' => 'documents/source.txt']);
        Storage::disk('local')->put($document->storage_key, 'index me');

        (new IndexDocument($document->id))->handle(app(FastApiRagClient::class));

        $document->refresh();
        $this->assertSame(Document::StatusReady, $document->status);
        $this->assertSame('ready', $document->rag_stage);
        $this->assertSame(3, $document->chunk_count);
        $this->assertSame('intfloat/e5-base-v2', $document->embedding_model);
        $this->assertNotNull($document->indexed_at);
    }
}
