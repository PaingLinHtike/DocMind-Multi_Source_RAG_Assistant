<?php

namespace App\Jobs;

use App\Models\Document;
use App\Services\FastApiRagClient;
use App\Support\DocumentIndexFailureMessage;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Support\Facades\Log;
use Throwable;

class IndexDocument implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(public readonly string $documentId, public readonly string $runId) {}

    /**
     * @return array<int, object>
     */
    public function middleware(): array
    {
        return [
            (new WithoutOverlapping("document-index:{$this->documentId}"))
                ->releaseAfter(5)
                ->expireAfter(3600),
        ];
    }

    public function handle(FastApiRagClient $client): void
    {
        $started = Document::query()
            ->whereKey($this->documentId)
            ->where('index_run_id', $this->runId)
            ->whereIn('status', [Document::StatusPending, Document::StatusProcessing])
            ->update([
                'status' => Document::StatusProcessing,
                'rag_stage' => 'processing',
                'failure_reason' => null,
            ]);

        if ($started === 0) {
            return;
        }

        $document = Document::query()->findOrFail($this->documentId);

        try {
            $result = $client->index($document, $this->runId);
            $completed = Document::query()
                ->whereKey($this->documentId)
                ->where('index_run_id', $this->runId)
                ->where('status', Document::StatusProcessing)
                ->update([
                    'status' => Document::StatusReady,
                    'rag_stage' => 'ready',
                    'chunk_count' => $result['chunk_count'],
                    'embedding_model' => $result['embedding_model'],
                    'vector_collection' => $result['collection'],
                    'indexed_at' => now(),
                    'index_run_id' => null,
                ]);

            if ($completed === 0) {
                $this->deleteStaleIndex($client, $document);
            }
        } catch (Throwable $exception) {
            if (! $this->isCurrentRun()) {
                $this->deleteStaleIndex($client, $document);

                return;
            }

            throw $exception;
        }
    }

    public function failed(Throwable $exception): void
    {
        Document::query()
            ->whereKey($this->documentId)
            ->where('index_run_id', $this->runId)
            ->whereIn('status', [Document::StatusPending, Document::StatusProcessing])
            ->update([
                'status' => Document::StatusFailed,
                'rag_stage' => 'failed',
                'failure_reason' => DocumentIndexFailureMessage::from($exception),
                'index_run_id' => null,
            ]);
    }

    private function isCurrentRun(): bool
    {
        return Document::query()
            ->whereKey($this->documentId)
            ->where('index_run_id', $this->runId)
            ->whereIn('status', [Document::StatusPending, Document::StatusProcessing])
            ->exists();
    }

    private function deleteStaleIndex(FastApiRagClient $client, Document $document): void
    {
        try {
            $client->deleteIndex((string) $document->user_id, (string) $document->id);
        } catch (Throwable) {
            Log::warning('Stale document index cleanup could not be completed.', [
                'document_id' => $document->id,
                'index_run_id' => $this->runId,
            ]);
        }
    }
}
