<?php

namespace App\Models;

use Database\Factories\CitationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['message_id', 'document_id', 'chunk_id', 'page_number', 'citation_number', 'snippet'])]
class Citation extends Model
{
    /** @use HasFactory<CitationFactory> */
    use HasFactory, HasUuids;

    protected $table = 'message_sources';

    public $timestamps = false;

    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class);
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }
}
