<?php

namespace App\Jobs;

use App\Services\FastApiRagClient;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class DeleteDocumentIndex implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly string $userId, public readonly string $documentId) {}

    public function handle(FastApiRagClient $client): void
    {
        $client->deleteIndex($this->userId, $this->documentId);
    }
}
