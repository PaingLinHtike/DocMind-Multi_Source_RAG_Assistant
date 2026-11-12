<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CitationResource extends JsonResource
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
            'document_id' => $this->document_id,
            'document_name' => $this->whenLoaded('document', fn (): ?string => $this->document?->filename),
            'chunk_id' => $this->chunk_id,
            'page_number' => $this->page_number,
            'citation_number' => $this->citation_number,
            'snippet' => $this->snippet,
        ];
    }
}
