<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('documents')) {
            Schema::create('documents', function (Blueprint $table): void {
                $table->uuid('id')->primary();
                $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
                $table->string('filename');
                $table->string('original_name');
                $table->string('extension', 20);
                $table->string('mime_type');
                $table->string('source_type', 20);
                $table->text('source_url')->nullable();
                $table->string('storage_disk')->default('local');
                $table->text('storage_key')->nullable();
                $table->string('checksum', 64)->nullable();
                $table->string('status', 20)->default('PENDING');
                $table->unsignedInteger('chunk_count')->default(0);
                $table->unsignedBigInteger('size_bytes')->nullable();
                $table->text('failure_reason')->nullable();
                $table->timestampTz('indexed_at')->nullable();
                $table->timestampsTz();

                $table->index('status');
            });
        } else {
            $hasOriginalName = Schema::hasColumn('documents', 'original_name');
            $hasExtension = Schema::hasColumn('documents', 'extension');
            $hasMimeType = Schema::hasColumn('documents', 'mime_type');
            $hasStorageDisk = Schema::hasColumn('documents', 'storage_disk');
            $hasSizeBytes = Schema::hasColumn('documents', 'size_bytes');
            $hasFailureReason = Schema::hasColumn('documents', 'failure_reason');
            $hasIndexedAt = Schema::hasColumn('documents', 'indexed_at');

            Schema::table('documents', function (Blueprint $table) use (
                $hasOriginalName,
                $hasExtension,
                $hasMimeType,
                $hasStorageDisk,
                $hasSizeBytes,
                $hasFailureReason,
                $hasIndexedAt,
            ): void {
                if (! $hasOriginalName) {
                    $table->string('original_name')->nullable();
                }
                if (! $hasExtension) {
                    $table->string('extension', 20)->nullable();
                }
                if (! $hasMimeType) {
                    $table->string('mime_type')->nullable();
                }
                if (! $hasStorageDisk) {
                    $table->string('storage_disk')->default('local');
                }
                if (! $hasSizeBytes) {
                    $table->unsignedBigInteger('size_bytes')->nullable();
                }
                if (! $hasFailureReason) {
                    $table->text('failure_reason')->nullable();
                }
                if (! $hasIndexedAt) {
                    $table->timestampTz('indexed_at')->nullable();
                }
            });
        }

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE documents DROP CONSTRAINT IF EXISTS chk_source_type');
            DB::statement("ALTER TABLE documents ADD CONSTRAINT chk_source_type CHECK (source_type IN ('pdf', 'docx', 'txt', 'web'))");
            DB::statement('ALTER TABLE documents DROP CONSTRAINT IF EXISTS chk_document_status');
            DB::statement("ALTER TABLE documents ADD CONSTRAINT chk_document_status CHECK (status IN ('UPLOADED', 'PENDING', 'PROCESSING', 'READY', 'FAILED'))");
        }
    }

    /**
     * Adopted tables, columns, and constraints are intentionally retained.
     */
    public function down(): void {}
};
