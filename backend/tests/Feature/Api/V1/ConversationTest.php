<?php

namespace Tests\Feature\Api\V1;

use App\Contracts\RagGateway;
use App\Data\RagDispatchResult;
use App\Models\Citation;
use App\Models\Conversation;
use App\Models\Document;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class ConversationTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_conversation_index_is_user_scoped_and_ordered_by_recent_activity(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        Conversation::factory()->for($user)->create(['title' => 'Older', 'updated_at' => now()->subHour()]);
        Conversation::factory()->for($user)->create(['title' => 'Newer', 'updated_at' => now()]);
        Conversation::factory()->for($otherUser)->create(['title' => 'Hidden']);
        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/v1/conversations');

        $response
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.title', 'Newer')
            ->assertJsonPath('data.1.title', 'Older')
            ->assertJsonMissing(['title' => 'Hidden'])
            ->assertJsonMissingPath('data.0.messages');
    }

    public function test_conversation_store_uses_default_title(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/v1/conversations');

        $response
            ->assertCreated()
            ->assertJsonPath('data.title', 'New Chat');
        $this->assertDatabaseHas('conversations', ['user_id' => $user->id, 'title' => 'New Chat']);
    }

    public function test_conversation_store_accepts_explicit_title(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/v1/conversations', ['title' => 'Research']);

        $response
            ->assertCreated()
            ->assertJsonPath('data.title', 'Research');
    }

    public function test_conversation_show_embeds_ordered_messages(): void
    {
        $user = User::factory()->create();
        $conversation = Conversation::factory()->for($user)->create();
        Message::factory()->for($conversation)->create(['content' => 'First', 'created_at' => now()->subMinute()]);
        Message::factory()->for($conversation)->create(['content' => 'Second', 'created_at' => now()]);
        $this->actingAs($user, 'web');

        $response = $this->getJson("/api/v1/conversations/{$conversation->id}");

        $response
            ->assertOk()
            ->assertJsonCount(2, 'data.messages')
            ->assertJsonPath('data.messages.0.content', 'First')
            ->assertJsonPath('data.messages.1.content', 'Second');
    }

    public function test_conversation_update_renames_title(): void
    {
        $user = User::factory()->create();
        $conversation = Conversation::factory()->for($user)->create(['title' => 'Old']);
        $this->actingAs($user, 'web');

        $response = $this->patchJson("/api/v1/conversations/{$conversation->id}", ['title' => 'Renamed']);

        $response->assertOk()->assertJsonPath('data.title', 'Renamed');
        $this->assertSame('Renamed', $conversation->refresh()->title);
    }

    public function test_conversation_delete_cascades_messages(): void
    {
        $user = User::factory()->create();
        $conversation = Conversation::factory()->for($user)->create();
        $message = Message::factory()->for($conversation)->create();
        $this->actingAs($user, 'web');

        $response = $this->deleteJson("/api/v1/conversations/{$conversation->id}");

        $response->assertNoContent();
        $this->assertDatabaseMissing('conversations', ['id' => $conversation->id]);
        $this->assertDatabaseMissing('messages', ['id' => $message->id]);
    }

    public function test_cross_user_conversation_actions_return_404(): void
    {
        $owner = User::factory()->create();
        $attacker = User::factory()->create();
        $conversation = Conversation::factory()->for($owner)->create();
        $this->actingAs($attacker, 'web');

        $this->getJson("/api/v1/conversations/{$conversation->id}")->assertNotFound();
        $this->patchJson("/api/v1/conversations/{$conversation->id}", ['title' => 'Stolen'])->assertNotFound();
        $this->deleteJson("/api/v1/conversations/{$conversation->id}")->assertNotFound();

        $this->assertDatabaseHas('conversations', ['id' => $conversation->id, 'title' => $conversation->title]);
    }

    public function test_question_returns_202_with_one_pending_user_message(): void
    {
        $user = User::factory()->create();
        $conversation = Conversation::factory()->for($user)->create();
        $this->actingAs($user, 'web');

        $response = $this->postJson("/api/v1/conversations/{$conversation->id}/messages", [
            'content' => 'What does the report say?',
        ]);

        $response
            ->assertAccepted()
            ->assertJsonPath('data.role', 'user')
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.content', 'What does the report say?');
        $this->assertDatabaseCount('messages', 1);
        $this->assertDatabaseHas('messages', [
            'conversation_id' => $conversation->id,
            'role' => Message::RoleUser,
            'status' => Message::StatusPending,
        ]);
    }

    public function test_question_does_not_create_assistant_message(): void
    {
        $user = User::factory()->create();
        $conversation = Conversation::factory()->for($user)->create();
        $this->actingAs($user, 'web');

        $this->postJson("/api/v1/conversations/{$conversation->id}/messages", [
            'content' => 'Summarize this.',
        ])->assertAccepted();

        $this->assertDatabaseMissing('messages', ['role' => Message::RoleAssistant]);
    }

    public function test_question_updates_conversation_activity(): void
    {
        $user = User::factory()->create();
        $conversation = Conversation::factory()->for($user)->create(['updated_at' => now()->subDay()]);
        $previousActivity = $conversation->updated_at;
        $this->actingAs($user, 'web');

        $this->postJson("/api/v1/conversations/{$conversation->id}/messages", [
            'content' => 'Any updates?',
        ])->assertAccepted();

        $this->assertTrue($conversation->refresh()->updated_at->isAfter($previousActivity));
    }

    public function test_question_rejects_empty_or_oversized_content(): void
    {
        $user = User::factory()->create();
        $conversation = Conversation::factory()->for($user)->create();
        $this->actingAs($user, 'web');

        $this->postJson("/api/v1/conversations/{$conversation->id}/messages", ['content' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['content']);
        $this->postJson("/api/v1/conversations/{$conversation->id}/messages", ['content' => str_repeat('a', 10001)])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['content']);
        $this->assertDatabaseCount('messages', 0);
    }

    public function test_question_returns_429_after_twenty_requests_per_minute(): void
    {
        $user = User::factory()->create();
        $conversation = Conversation::factory()->for($user)->create();
        $this->actingAs($user, 'web');

        for ($request = 1; $request <= 20; $request++) {
            $this->postJson("/api/v1/conversations/{$conversation->id}/messages", [
                'content' => "Question {$request}",
            ])->assertAccepted();
        }

        $this->postJson("/api/v1/conversations/{$conversation->id}/messages", [
            'content' => 'Limited question',
        ])->assertTooManyRequests();
        $this->assertDatabaseCount('messages', 20);
    }

    public function test_cross_user_question_returns_404(): void
    {
        $owner = User::factory()->create();
        $attacker = User::factory()->create();
        $conversation = Conversation::factory()->for($owner)->create();
        $this->actingAs($attacker, 'web');

        $this->postJson("/api/v1/conversations/{$conversation->id}/messages", [
            'content' => 'Reveal this conversation.',
        ])->assertNotFound();
        $this->assertDatabaseCount('messages', 0);
    }

    public function test_completed_assistant_message_serializes_ordered_citations(): void
    {
        $user = User::factory()->create();
        $conversation = Conversation::factory()->for($user)->create();
        $message = Message::factory()->for($conversation)->create([
            'role' => Message::RoleAssistant,
            'status' => Message::StatusCompleted,
        ]);
        $firstDocument = Document::factory()->for($user)->create(['filename' => 'first.pdf']);
        $secondDocument = Document::factory()->for($user)->create(['filename' => 'second.pdf']);
        Citation::factory()->for($message)->for($secondDocument)->create(['citation_number' => 2]);
        Citation::factory()->for($message)->for($firstDocument)->create(['citation_number' => 1]);
        $this->actingAs($user, 'web');

        $response = $this->getJson("/api/v1/conversations/{$conversation->id}");

        $response
            ->assertOk()
            ->assertJsonCount(2, 'data.messages.0.citations')
            ->assertJsonPath('data.messages.0.citations.0.citation_number', 1)
            ->assertJsonPath('data.messages.0.citations.0.document_name', 'first.pdf')
            ->assertJsonPath('data.messages.0.citations.1.citation_number', 2);
    }

    public function test_question_dispatches_the_persisted_message_to_rag_gateway(): void
    {
        $fakeGateway = new class implements RagGateway
        {
            public ?string $messageId = null;

            public function dispatch(Message $message): RagDispatchResult
            {
                $this->messageId = $message->id;

                return new RagDispatchResult(true, 'accepted');
            }
        };
        $this->app->instance(RagGateway::class, $fakeGateway);
        $user = User::factory()->create();
        $conversation = Conversation::factory()->for($user)->create();
        $this->actingAs($user, 'web');

        $response = $this->postJson("/api/v1/conversations/{$conversation->id}/messages", [
            'content' => 'Dispatch this question.',
        ]);

        $response->assertAccepted();
        $this->assertSame($response->json('data.id'), $fakeGateway->messageId);
        $this->assertDatabaseHas('messages', ['id' => $fakeGateway->messageId]);
    }
}
