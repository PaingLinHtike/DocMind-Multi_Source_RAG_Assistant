<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Number;

class DocumentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->filename,
            'type' => strtoupper($this->extension ?? $this->source_type),
            'status' => strtolower($this->status),
            'status_label' => ucfirst(strtolower($this->status)),
            'chunks' => $this->chunk_count ?: null,
            'uploaded_at' => $this->created_at?->toISOString(),
            'size_bytes' => $this->size_bytes,
            'size' => $this->size_bytes === null ? null : Number::fileSize($this->size_bytes, precision: 1),
            'source' => 'Upload',
            'storage' => $this->storage_key,
            'content_url' => route('api.v1.documents.content', $this->id),
            'download_url' => route('api.v1.documents.download', $this->id),
        ];
    }
}
