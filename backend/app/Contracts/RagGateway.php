<?php

namespace App\Contracts;

use App\Data\RagDispatchResult;
use App\Models\Message;

interface RagGateway
{
    public function dispatch(Message $message): RagDispatchResult;
}
