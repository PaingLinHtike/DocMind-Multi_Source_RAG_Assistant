<?php

namespace App\Services;

use App\Contracts\RagGateway;
use App\Data\RagDispatchResult;
use App\Models\Message;

class PendingRagGateway implements RagGateway
{
    public function dispatch(Message $message): RagDispatchResult
    {
        return new RagDispatchResult(false, Message::StatusPending);
    }
}
