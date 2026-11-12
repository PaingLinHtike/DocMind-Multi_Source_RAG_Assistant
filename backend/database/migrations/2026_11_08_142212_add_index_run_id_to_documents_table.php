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
        Schema::table('documents', function (Blueprint $table): void {
            $table->uuid('index_run_id')->nullable()->index();
            $table->string('rag_stage', 30)->default('uploaded')->change();
        });

        DB::table('documents')
            ->whereIn('status', ['UPLOADED', 'PENDING', 'PROCESSING'])
            ->update([
                'status' => 'UPLOADED',
                'rag_stage' => 'uploaded',
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table): void {
            $table->dropColumn('index_run_id');
            $table->string('rag_stage', 30)->default('queued')->change();
        });
    }
};
