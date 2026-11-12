<?php

namespace App\Services;

use App\Contracts\RagGateway;
use App\Data\RagDispatchResult;
use App\Jobs\GenerateRagAnswer;
use App\Models\Message;

class QueuedRagGateway implements RagGateway
{
    public function dispatch(Message $message): RagDispatchResult
    {
        GenerateRagAnswer::dispatch($message->id)->afterCommit();

        return new RagDispatchResult(true, Message::StatusPending);
    }
}
