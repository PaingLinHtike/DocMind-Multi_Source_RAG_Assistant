<?php

namespace App\Services;

use App\Models\Document;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class FastApiRagClient
{
    /** @return array{chunk_count: int, collection: string, embedding_model: string} */
    public function index(Document $document): array
    {
        $contents = Storage::disk($document->storage_disk)->get($document->storage_key);
        $response = $this->request()->attach('file', $contents, $document->filename)
            ->post('/internal/v1/documents/index', [
                'user_id' => (string) $document->user_id,
                'document_id' => (string) $document->id,
                'filename' => $document->filename,
                'extension' => $document->extension,
            ])->throw();

        /** @var array{chunk_count: int, collection: string, embedding_model: string} $result */
        $result = $response->json();

        return $result;
    }

    public function deleteIndex(string $userId, string $documentId): void
    {
        $this->request()->delete("/internal/v1/documents/{$documentId}", ['user_id' => $userId])->throw();
    }

    private function request(): PendingRequest
    {
        $token = (string) config('docmind.fastapi.internal_token');
        if ($token === '') {
            throw new RuntimeException('FastAPI internal token is not configured.');
        }

        return Http::baseUrl((string) config('docmind.fastapi.base_url'))
            ->withHeader('X-Internal-Token', $token)
            ->timeout((int) config('docmind.fastapi.timeout'))
            ->retry(2, 250);
    }
}
