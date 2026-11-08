<?php

namespace App\Models;

use Database\Factories\MessageFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['conversation_id', 'role', 'content', 'status', 'failure_reason'])]
class Message extends Model
{
    /** @use HasFactory<MessageFactory> */
    use HasFactory, HasUuids;

    public const string RoleUser = 'user';

    public const string RoleAssistant = 'assistant';

    public const string StatusPending = 'pending';

    public const string StatusProcessing = 'processing';

    public const string StatusCompleted = 'completed';

    public const string StatusFailed = 'failed';

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function citations(): HasMany
    {
        return $this->hasMany(Citation::class)->orderBy('citation_number');
    }
}
