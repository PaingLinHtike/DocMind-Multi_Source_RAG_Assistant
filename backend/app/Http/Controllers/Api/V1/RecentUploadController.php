<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\DocumentResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RecentUploadController extends Controller
{
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        $documents = $request->user()
            ->documents()
            ->latest()
            ->limit(10)
            ->get();

        return DocumentResource::collection($documents);
    }
}
