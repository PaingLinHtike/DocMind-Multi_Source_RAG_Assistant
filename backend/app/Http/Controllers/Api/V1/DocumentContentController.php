<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentContentController extends Controller
{
    public function show(Request $request, string $document): StreamedResponse
    {
        $ownedDocument = $this->ownedDocument($request, $document);
        Gate::authorize('view', $ownedDocument);

        abort_unless(
            Storage::disk($ownedDocument->storage_disk)->exists($ownedDocument->storage_key),
            404,
        );

        return Storage::disk($ownedDocument->storage_disk)->response(
            $ownedDocument->storage_key,
            $ownedDocument->filename,
        );
    }

    public function download(Request $request, string $document): StreamedResponse
    {
        $ownedDocument = $this->ownedDocument($request, $document);
        Gate::authorize('view', $ownedDocument);

        abort_unless(
            Storage::disk($ownedDocument->storage_disk)->exists($ownedDocument->storage_key),
            404,
        );

        return Storage::disk($ownedDocument->storage_disk)->download(
            $ownedDocument->storage_key,
            $ownedDocument->filename,
        );
    }

    private function ownedDocument(Request $request, string $document): Document
    {
        return $request->user()->documents()->findOrFail($document);
    }
}
