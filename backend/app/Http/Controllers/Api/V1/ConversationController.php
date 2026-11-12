<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreConversationRequest;
use App\Http\Requests\Api\V1\UpdateConversationRequest;
use App\Http\Resources\Api\V1\ConversationResource;
use App\Models\Conversation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

class ConversationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Conversation::class);

        return ConversationResource::collection(
            $request->user()->conversations()->latest('updated_at')->paginate(20),
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreConversationRequest $request): JsonResponse
    {
        $conversation = $request->user()->conversations()->create([
            'title' => $request->string('title', 'New Chat')->trim()->toString() ?: 'New Chat',
        ]);

        return (new ConversationResource($conversation))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, string $conversation): ConversationResource
    {
        $ownedConversation = $this->ownedConversation($request, $conversation);
        Gate::authorize('view', $ownedConversation);
        $ownedConversation->load(['messages.citations.document']);

        return new ConversationResource($ownedConversation);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateConversationRequest $request, string $conversation): ConversationResource
    {
        $ownedConversation = $this->ownedConversation($request, $conversation);
        Gate::authorize('update', $ownedConversation);
        $ownedConversation->update([
            'title' => $request->string('title')->trim()->toString(),
        ]);

        return new ConversationResource($ownedConversation->refresh());
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, string $conversation): HttpResponse
    {
        $ownedConversation = $this->ownedConversation($request, $conversation);
        Gate::authorize('delete', $ownedConversation);
        $ownedConversation->delete();

        return response()->noContent();
    }

    private function ownedConversation(Request $request, string $conversation): Conversation
    {
        return $request->user()->conversations()->findOrFail($conversation);
    }
}
