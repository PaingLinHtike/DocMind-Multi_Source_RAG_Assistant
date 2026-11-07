<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DashboardResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'user' => new UserResource($this->resource['user']),
            'metrics' => $this->resource['metrics'],
            'chat_activity' => $this->resource['chat_activity'],
            'recent_conversations' => ConversationResource::collection($this->resource['recent_conversations']),
            'recent_uploads' => DocumentResource::collection($this->resource['recent_uploads']),
        ];
    }
}
