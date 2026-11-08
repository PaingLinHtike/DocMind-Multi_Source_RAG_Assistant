<?php

namespace Tests\Feature\Jobs;

use App\Jobs\GenerateRagAnswer;
use App\Models\Document;
use App\Models\Message;
use App\Services\FastApiRagClient;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GenerateRagAnswerTest extends TestCase
{
    use RefreshDatabase;

    public function test_job_persists_assistant_answer_and_owned_citations(): void
    {
        config(['docmind.fastapi.internal_token' => 'test-token']);
        $message = Message::factory()->create();
        $document = Document::factory()->create([
            'user_id' => $message->conversation->user_id,
            'status' => Document::StatusReady,
        ]);
        Http::fake(['*/internal/v1/answers' => Http::response([
            'answer' => 'Grounded answer [1]',
            'citations' => [[
                'number' => 1, 'document_id' => $document->id, 'document_name' => $document->filename,
                'page_number' => 2, 'chunk_id' => 'chunk-1', 'snippet' => 'Evidence',
            ]],
        ])]);

        (new GenerateRagAnswer($message->id))->handle(app(FastApiRagClient::class));

        Http::assertSent(function ($request) use ($document): bool {
            return $request['document_ids'] === [$document->id];
        });

        $this->assertSame(Message::StatusCompleted, $message->refresh()->status);
        $assistant = $message->conversation->messages()->where('role', Message::RoleAssistant)->firstOrFail();
        $this->assertSame('Grounded answer [1]', $assistant->content);
        $this->assertSame($document->id, $assistant->citations()->firstOrFail()->document_id);
    }

    public function test_terminal_failure_does_not_persist_provider_secrets(): void
    {
        $message = Message::factory()->create();
        (new GenerateRagAnswer($message->id))->failed(new \RuntimeException('Bearer private-secret'));
        $this->assertSame('Answer generation failed after retries.', $message->refresh()->failure_reason);
    }
}
