<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\DocumentResource;
use App\Jobs\IndexDocument;
use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

class ReindexDocumentController extends Controller
{
    public function __invoke(Request $request, string $document): JsonResponse
    {
        $ownedDocument = $request->user()->documents()->findOrFail($document);
        Gate::authorize('update', $ownedDocument);
        $ownedDocument->update([
            'status' => Document::StatusPending,
            'chunk_count' => 0,
            'failure_reason' => null,
            'indexed_at' => null,
            'rag_stage' => 'queued',
            'embedding_model' => null,
            'vector_collection' => null,
        ]);
        IndexDocument::dispatch($ownedDocument->id)->afterCommit();

        return (new DocumentResource($ownedDocument->refresh()))
            ->response()
            ->setStatusCode(Response::HTTP_ACCEPTED);
    }
}
