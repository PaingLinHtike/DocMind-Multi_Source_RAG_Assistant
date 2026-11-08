<?php

namespace App\Jobs;

use App\Models\Message;
use App\Services\FastApiRagClient;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Throwable;

class GenerateRagAnswer implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(public readonly string $messageId) {}

    public function handle(FastApiRagClient $client): void
    {
        $message = Message::query()->with('conversation')->findOrFail($this->messageId);
        if ($message->status === Message::StatusCompleted) {
            return;
        }
        $message->update(['status' => Message::StatusProcessing, 'failure_reason' => null]);
        $result = $client->generateAnswer($message);

        DB::transaction(function () use ($message, $result): void {
            $assistant = $message->conversation->messages()->create([
                'role' => Message::RoleAssistant,
                'content' => $result['answer'],
                'status' => Message::StatusCompleted,
            ]);
            $ownedDocumentIds = $message->conversation->user->documents()->pluck('id')->all();
            foreach ($result['citations'] as $citation) {
                if (! in_array($citation['document_id'], $ownedDocumentIds, true)) {
                    continue;
                }
                $assistant->citations()->create([
                    'document_id' => $citation['document_id'],
                    'chunk_id' => $citation['chunk_id'],
                    'page_number' => $citation['page_number'],
                    'citation_number' => $citation['number'],
                    'snippet' => $citation['snippet'],
                ]);
            }
            $message->update(['status' => Message::StatusCompleted]);
        });
    }

    public function failed(Throwable $exception): void
    {
        Message::query()->whereKey($this->messageId)->update([
            'status' => Message::StatusFailed,
            'failure_reason' => str($exception->getMessage())->limit(500)->toString(),
        ]);
    }
}
