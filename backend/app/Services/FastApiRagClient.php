<?php

namespace App\Services;

use App\Models\Document;
use App\Models\Message;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class FastApiRagClient
{
    /** @return array{chunk_count: int, collection: string, embedding_model: string} */
    public function index(Document $document, string $runId): array
    {
        $contents = Storage::disk($document->storage_disk)->get($document->storage_key);
        $response = $this->request()->attach('file', $contents, $document->filename)
            ->post('/internal/v1/documents/index', [
                'user_id' => (string) $document->user_id,
                'document_id' => (string) $document->id,
                'filename' => $document->filename,
                'extension' => $document->extension,
                'run_id' => $runId,
            ])->throw();

        /** @var array{chunk_count: int, collection: string, embedding_model: string} $result */
        $result = $response->json();

        return $result;
    }

    public function deleteIndex(string $userId, string $documentId): void
    {
        $this->request()->delete("/internal/v1/documents/{$documentId}", ['user_id' => $userId])->throw();
    }

    public function cancelIndex(string $runId): void
    {
        $this->request(timeout: 3, retry: false)
            ->post("/internal/v1/index-runs/{$runId}/cancel")
            ->throw();
    }

    /** @return array{answer: string, citations: list<array{number: int, document_id: string, document_name: string, page_number: int|null, chunk_id: string, snippet: string}>} */
    public function generateAnswer(Message $message): array
    {
        $message->loadMissing('conversation');
        $readyDocumentIds = $message->conversation->user->documents()
            ->where('status', Document::StatusReady)
            ->pluck('id')
            ->all();
        $response = $this->request()->post('/internal/v1/answers', [
            'user_id' => (string) $message->conversation->user_id,
            'conversation_id' => (string) $message->conversation_id,
            'message_id' => (string) $message->id,
            'question' => $message->content,
            'document_ids' => $readyDocumentIds,
        ])->throw();

        /** @var array{answer: string, citations: list<array{number: int, document_id: string, document_name: string, page_number: int|null, chunk_id: string, snippet: string}>} $result */
        $result = $response->json();

        return $result;
    }

    private function request(?int $timeout = null, bool $retry = true): PendingRequest
    {
        $token = (string) config('docmind.fastapi.internal_token');
        if ($token === '') {
            throw new RuntimeException('FastAPI internal token is not configured.');
        }

        $request = Http::baseUrl((string) config('docmind.fastapi.base_url'))
            ->withHeader('X-Internal-Token', $token)
            ->timeout($timeout ?? (int) config('docmind.fastapi.timeout'));

        return $retry ? $request->retry(2, 250) : $request;
    }
}
