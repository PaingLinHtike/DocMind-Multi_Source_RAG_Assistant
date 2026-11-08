<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\DocumentResource;
use App\Jobs\IndexDocument;
use App\Models\Document;
use App\Services\FastApiRagClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class DocumentIndexController extends Controller
{
    public function store(Request $request, string $document): JsonResponse
    {
        $result = DB::transaction(function () use ($request, $document): Document|JsonResponse {
            $ownedDocument = $request->user()->documents()->lockForUpdate()->findOrFail($document);
            Gate::authorize('update', $ownedDocument);

            if (in_array($ownedDocument->status, [Document::StatusPending, Document::StatusProcessing], true)) {
                return response()->json(['message' => 'This document is already being indexed.'], Response::HTTP_CONFLICT);
            }

            $runId = (string) Str::uuid();
            $ownedDocument->update([
                'status' => Document::StatusPending,
                'chunk_count' => 0,
                'failure_reason' => null,
                'indexed_at' => null,
                'rag_stage' => 'queued',
                'embedding_model' => null,
                'vector_collection' => null,
                'index_run_id' => $runId,
            ]);
            IndexDocument::dispatch($ownedDocument->id, $runId)->afterCommit();

            return $ownedDocument->refresh();
        });

        if ($result instanceof JsonResponse) {
            return $result;
        }

        return (new DocumentResource($result))
            ->response()
            ->setStatusCode(Response::HTTP_ACCEPTED);
    }

    public function destroy(Request $request, string $document, FastApiRagClient $client): JsonResponse
    {
        $runId = null;
        $wasProcessing = false;
        $result = DB::transaction(function () use ($request, $document, &$runId, &$wasProcessing): Document|JsonResponse {
            $ownedDocument = $request->user()->documents()->lockForUpdate()->findOrFail($document);
            Gate::authorize('update', $ownedDocument);

            if (! in_array($ownedDocument->status, [Document::StatusPending, Document::StatusProcessing], true)) {
                return response()->json(['message' => 'This document is not being indexed.'], Response::HTTP_CONFLICT);
            }

            $runId = $ownedDocument->index_run_id;
            $wasProcessing = $ownedDocument->status === Document::StatusProcessing;
            $ownedDocument->update([
                'status' => Document::StatusUploaded,
                'chunk_count' => 0,
                'failure_reason' => null,
                'indexed_at' => null,
                'rag_stage' => 'uploaded',
                'embedding_model' => null,
                'vector_collection' => null,
                'index_run_id' => null,
            ]);

            return $ownedDocument->refresh();
        });

        if ($result instanceof JsonResponse) {
            return $result;
        }

        if ($wasProcessing && is_string($runId) && $runId !== '') {
            try {
                $client->cancelIndex($runId);
            } catch (Throwable) {
                Log::warning('The active document index could not be cancelled immediately.', [
                    'document_id' => $result->id,
                    'index_run_id' => $runId,
                ]);
            }
        }

        return (new DocumentResource($result))->response();
    }
}
