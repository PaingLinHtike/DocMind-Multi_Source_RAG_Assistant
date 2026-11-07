<?php

namespace App\Services;

use App\Contracts\RagGateway;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class SubmitQuestion
{
    public function __construct(private readonly RagGateway $ragGateway) {}

    public function handle(User $user, Conversation $conversation, string $content): Message
    {
        return DB::transaction(function () use ($user, $conversation, $content): Message {
            abort_unless($conversation->user_id === $user->getAuthIdentifier(), 404);

            $message = $conversation->messages()->create([
                'role' => Message::RoleUser,
                'content' => $content,
                'status' => Message::StatusPending,
            ]);
            $conversation->touch();
            $this->ragGateway->dispatch($message);

            return $message;
        });
    }
}
