<?php

namespace Tests\Feature\Api\V1;

use App\Models\Conversation;
use App\Models\Document;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_dashboard_requires_authentication_and_excludes_other_users_data(): void
    {
        $this->getJson('/api/v1/dashboard')->assertUnauthorized();

        $user = User::factory()->create(['name' => 'Aung']);
        $otherUser = User::factory()->create();
        Document::factory()->for($user)->create(['size_bytes' => 1000]);
        Document::factory()->for($otherUser)->count(3)->create(['size_bytes' => 9000]);
        Conversation::factory()->for($otherUser)->create(['title' => 'Hidden conversation']);
        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/v1/dashboard');

        $response
            ->assertOk()
            ->assertJsonPath('data.user.name', 'Aung')
            ->assertJsonPath('data.metrics.documents.value', 1)
            ->assertJsonPath('data.metrics.conversations.value', 0)
            ->assertJsonPath('data.metrics.storage_bytes.value', 1000)
            ->assertJsonMissing(['title' => 'Hidden conversation']);
    }

    public function test_dashboard_counts_documents_conversations_messages_and_storage(): void
    {
        $user = User::factory()->create();
        Document::factory()->for($user)->create(['size_bytes' => 1000]);
        Document::factory()->for($user)->create(['size_bytes' => 2000]);
        $firstConversation = Conversation::factory()->for($user)->create();
        $secondConversation = Conversation::factory()->for($user)->create();
        Message::factory()->for($firstConversation)->count(2)->create();
        Message::factory()->for($secondConversation)->create(['role' => Message::RoleAssistant]);
        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/v1/dashboard');

        $response
            ->assertOk()
            ->assertJsonPath('data.metrics.documents.value', 2)
            ->assertJsonPath('data.metrics.conversations.value', 2)
            ->assertJsonPath('data.metrics.messages.value', 3)
            ->assertJsonPath('data.metrics.storage_bytes.value', 3000);
    }

    public function test_dashboard_returns_seven_zero_filled_local_date_buckets(): void
    {
        $this->travelTo('2026-11-07 12:00:00');
        $user = User::factory()->create();
        $conversation = Conversation::factory()->for($user)->create();
        Message::factory()->for($conversation)->create([
            'role' => Message::RoleUser,
            'created_at' => '2026-11-02 10:00:00',
        ]);
        Message::factory()->for($conversation)->count(2)->create([
            'role' => Message::RoleUser,
            'created_at' => '2026-11-07 10:00:00',
        ]);
        Message::factory()->for($conversation)->create([
            'role' => Message::RoleAssistant,
            'created_at' => '2026-11-07 11:00:00',
        ]);
        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/v1/dashboard');

        $response
            ->assertOk()
            ->assertJsonCount(7, 'data.chat_activity')
            ->assertJsonPath('data.chat_activity.0.date', '2026-11-01')
            ->assertJsonPath('data.chat_activity.0.count', 0)
            ->assertJsonPath('data.chat_activity.1.date', '2026-11-02')
            ->assertJsonPath('data.chat_activity.1.count', 1)
            ->assertJsonPath('data.chat_activity.6.date', '2026-11-07')
            ->assertJsonPath('data.chat_activity.6.count', 2);
    }

    public function test_dashboard_orders_three_recent_conversations_and_four_uploads(): void
    {
        $user = User::factory()->create();
        foreach (range(1, 5) as $index) {
            Conversation::factory()->for($user)->create([
                'title' => "Chat {$index}",
                'updated_at' => now()->subMinutes(5 - $index),
            ]);
            Document::factory()->for($user)->create([
                'filename' => "Document {$index}.pdf",
                'created_at' => now()->subMinutes(5 - $index),
            ]);
        }
        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/v1/dashboard');

        $response
            ->assertOk()
            ->assertJsonCount(3, 'data.recent_conversations')
            ->assertJsonPath('data.recent_conversations.0.title', 'Chat 5')
            ->assertJsonPath('data.recent_conversations.2.title', 'Chat 3')
            ->assertJsonCount(4, 'data.recent_uploads')
            ->assertJsonPath('data.recent_uploads.0.name', 'Document 5.pdf')
            ->assertJsonPath('data.recent_uploads.3.name', 'Document 2.pdf');
    }

    public function test_dashboard_trends_are_null_without_comparable_history(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/v1/dashboard');

        $response
            ->assertOk()
            ->assertJsonPath('data.metrics.documents.change', null)
            ->assertJsonPath('data.metrics.conversations.change', null)
            ->assertJsonPath('data.metrics.messages.change', null)
            ->assertJsonPath('data.metrics.storage_bytes.change', null);
    }
}
