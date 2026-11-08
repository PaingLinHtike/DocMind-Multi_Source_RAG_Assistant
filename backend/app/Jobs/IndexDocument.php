<?php

namespace App\Jobs;

use App\Models\Document;
use App\Services\FastApiRagClient;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class IndexDocument implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(public readonly string $documentId) {}

    public function handle(FastApiRagClient $client): void
    {
        $document = Document::query()->findOrFail($this->documentId);
        $document->update(['status' => Document::StatusProcessing, 'rag_stage' => 'processing', 'failure_reason' => null]);
        $result = $client->index($document);
        $document->update([
            'status' => Document::StatusReady,
            'rag_stage' => 'ready',
            'chunk_count' => $result['chunk_count'],
            'embedding_model' => $result['embedding_model'],
            'vector_collection' => $result['collection'],
            'indexed_at' => now(),
        ]);
    }

    public function failed(Throwable $exception): void
    {
        Document::query()->whereKey($this->documentId)->update([
            'status' => Document::StatusFailed,
            'rag_stage' => 'failed',
            'failure_reason' => 'Document indexing failed after retries.',
        ]);
    }
}
