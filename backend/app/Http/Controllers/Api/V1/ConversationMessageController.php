<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreMessageRequest;
use App\Http\Resources\Api\V1\MessageResource;
use App\Services\SubmitQuestion;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class ConversationMessageController extends Controller
{
    public function __invoke(
        StoreMessageRequest $request,
        string $conversation,
        SubmitQuestion $submitQuestion,
    ): JsonResponse {
        $ownedConversation = $request->user()->conversations()->findOrFail($conversation);
        $message = $submitQuestion->handle(
            $request->user(),
            $ownedConversation,
            $request->string('content')->trim()->toString(),
        );

        return (new MessageResource($message))
            ->response()
            ->setStatusCode(Response::HTTP_ACCEPTED);
    }
}
