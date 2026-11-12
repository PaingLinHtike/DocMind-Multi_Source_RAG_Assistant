<?php

namespace App\Models;

use Database\Factories\DocumentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'id',
    'user_id',
    'filename',
    'original_name',
    'extension',
    'mime_type',
    'source_type',
    'source_url',
    'storage_disk',
    'storage_key',
    'checksum',
    'status',
    'chunk_count',
    'size_bytes',
    'failure_reason',
    'indexed_at',
    'rag_stage',
    'embedding_model',
    'vector_collection',
    'index_run_id',
])]
class Document extends Model
{
    /** @use HasFactory<DocumentFactory> */
    use HasFactory, HasUuids;

    public const string StatusUploaded = 'UPLOADED';

    public const string StatusPending = 'PENDING';

    public const string StatusProcessing = 'PROCESSING';

    public const string StatusReady = 'READY';

    public const string StatusFailed = 'FAILED';

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function citations(): HasMany
    {
        return $this->hasMany(Citation::class);
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'chunk_count' => 'integer',
            'size_bytes' => 'integer',
            'indexed_at' => 'datetime',
        ];
    }
}
