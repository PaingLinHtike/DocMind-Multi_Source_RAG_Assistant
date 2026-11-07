<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('conversations')) {
            Schema::create('conversations', function (Blueprint $table): void {
                $table->uuid('id')->primary();
                $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
                $table->string('title')->default('New Chat');
                $table->timestampsTz();
            });
        }

        if (! Schema::hasTable('messages')) {
            Schema::create('messages', function (Blueprint $table): void {
                $table->uuid('id')->primary();
                $table->foreignUuid('conversation_id')->constrained()->cascadeOnDelete();
                $table->string('role', 20);
                $table->text('content');
                $table->string('status', 20)->default('pending');
                $table->text('failure_reason')->nullable();
                $table->timestampsTz();

                $table->index(['conversation_id', 'created_at']);
            });
        } else {
            $hasStatus = Schema::hasColumn('messages', 'status');
            $hasFailureReason = Schema::hasColumn('messages', 'failure_reason');
            $hasUpdatedAt = Schema::hasColumn('messages', 'updated_at');

            Schema::table('messages', function (Blueprint $table) use ($hasStatus, $hasFailureReason, $hasUpdatedAt): void {
                if (! $hasStatus) {
                    $table->string('status', 20)->default('pending');
                }
                if (! $hasFailureReason) {
                    $table->text('failure_reason')->nullable();
                }
                if (! $hasUpdatedAt) {
                    $table->timestampTz('updated_at')->nullable();
                }
            });
        }

        if (! Schema::hasTable('message_sources')) {
            Schema::create('message_sources', function (Blueprint $table): void {
                $table->uuid('id')->primary();
                $table->foreignUuid('message_id')->constrained()->cascadeOnDelete();
                $table->foreignUuid('document_id')->constrained()->cascadeOnDelete();
                $table->string('chunk_id');
                $table->unsignedInteger('page_number')->nullable();
                $table->unsignedInteger('citation_number');
                $table->text('snippet')->nullable();

                $table->unique(['message_id', 'citation_number']);
            });
        }
    }

    /**
     * Adopted tables and columns are intentionally retained.
     */
    public function down(): void {}
};
