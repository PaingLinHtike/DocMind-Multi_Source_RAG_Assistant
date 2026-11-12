<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreDocumentRequest;
use App\Http\Requests\Api\V1\UpdateDocumentRequest;
use App\Http\Resources\Api\V1\DocumentResource;
use App\Jobs\DeleteDocumentIndex;
use App\Models\Document;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class DocumentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', Document::class);

        $documents = $request->user()
            ->documents()
            ->when($request->filled('search'), function (Builder $query) use ($request): void {
                $query->whereLike('filename', '%'.$request->string('search')->trim()->toString().'%');
            })
            ->when($request->filled('status'), function (Builder $query) use ($request): void {
                $query->where('status', $request->string('status')->upper()->toString());
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return DocumentResource::collection($documents);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreDocumentRequest $request): JsonResponse
    {
        /** @var UploadedFile $file */
        $file = $request->file('document');
        $documentId = (string) Str::uuid();
        $extension = strtolower($file->getClientOriginalExtension());
        $storageName = $documentId.'.'.$extension;
        $storageDirectory = 'documents/'.$request->user()->getAuthIdentifier().'/'.$documentId;
        $storagePath = $file->storeAs($storageDirectory, $storageName, 'local');

        if ($storagePath === false) {
            throw new RuntimeException('The document could not be stored.');
        }

        try {
            $document = Document::query()->create([
                'id' => $documentId,
                'user_id' => $request->user()->getAuthIdentifier(),
                'filename' => $file->getClientOriginalName(),
                'original_name' => $file->getClientOriginalName(),
                'extension' => $extension,
                'mime_type' => $file->getMimeType(),
                'source_type' => $extension,
                'storage_disk' => 'local',
                'storage_key' => $storagePath,
                'checksum' => hash_file('sha256', $file->getRealPath()),
                'status' => Document::StatusUploaded,
                'chunk_count' => 0,
                'size_bytes' => (int) $file->getSize(),
                'rag_stage' => 'uploaded',
            ]);
        } catch (Throwable $exception) {
            Storage::disk('local')->delete($storagePath);

            throw $exception;
        }

        return (new DocumentResource($document))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, string $document): DocumentResource
    {
        $ownedDocument = $this->ownedDocument($request, $document);
        Gate::authorize('view', $ownedDocument);

        return new DocumentResource($ownedDocument);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateDocumentRequest $request, string $document): DocumentResource
    {
        $ownedDocument = $this->ownedDocument($request, $document);
        Gate::authorize('update', $ownedDocument);
        $ownedDocument->update([
            'filename' => $request->string('name')->trim()->toString(),
        ]);

        return new DocumentResource($ownedDocument->refresh());
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, string $document): HttpResponse|JsonResponse
    {
        $ownedDocument = $this->ownedDocument($request, $document);
        Gate::authorize('delete', $ownedDocument);

        if ($ownedDocument->storage_key !== null
            && Storage::disk($ownedDocument->storage_disk)->exists($ownedDocument->storage_key)
            && ! Storage::disk($ownedDocument->storage_disk)->delete($ownedDocument->storage_key)) {
            Log::error('Document file deletion failed.', ['document_id' => $ownedDocument->id]);

            return response()->json(['message' => 'The document could not be deleted.'], 500);
        }

        $userId = (string) $ownedDocument->user_id;
        $documentId = (string) $ownedDocument->id;
        $ownedDocument->delete();
        DeleteDocumentIndex::dispatch($userId, $documentId)->afterCommit();

        return response()->noContent();
    }

    private function ownedDocument(Request $request, string $document): Document
    {
        return $request->user()->documents()->findOrFail($document);
    }
}
