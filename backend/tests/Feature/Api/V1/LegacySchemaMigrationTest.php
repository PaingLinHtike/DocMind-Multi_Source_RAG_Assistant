<?php

namespace Tests\Feature\Api\V1;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class LegacySchemaMigrationTest extends TestCase
{
    public function test_migrations_preserve_an_existing_uuid_users_table(): void
    {
        Schema::create('users', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('email')->unique();
            $table->text('password_hash');
            $table->timestampTz('created_at')->useCurrent();
        });

        DB::table('users')->insert([
            'id' => 'c7cb2e04-f86f-4b1c-a042-e5031afc8741',
            'email' => 'existing@example.com',
            'password_hash' => 'preserved-hash',
            'created_at' => '2026-11-07 00:00:00',
        ]);

        Schema::create('documents', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->string('filename');
            $table->string('source_type', 20);
            $table->text('source_url')->nullable();
            $table->text('storage_key')->nullable();
            $table->string('checksum', 64)->nullable();
            $table->string('status', 20)->default('UPLOADED');
            $table->unsignedInteger('chunk_count')->default(0);
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent();
        });
        DB::table('documents')->insert([
            'id' => 'ba2bb395-417d-4f40-9c81-53ae72444d26',
            'user_id' => 'c7cb2e04-f86f-4b1c-a042-e5031afc8741',
            'filename' => 'preserved.pdf',
            'source_type' => 'pdf',
            'storage_key' => 'documents/preserved.pdf',
            'status' => 'UPLOADED',
            'chunk_count' => 3,
            'created_at' => '2026-11-07 00:00:00',
            'updated_at' => '2026-11-07 00:00:00',
        ]);

        $exitCode = Artisan::call('migrate', ['--force' => true]);

        $this->assertSame(0, $exitCode);
        $this->assertDatabaseHas('users', [
            'id' => 'c7cb2e04-f86f-4b1c-a042-e5031afc8741',
            'email' => 'existing@example.com',
            'password_hash' => 'preserved-hash',
        ]);
        $this->assertTrue(Schema::hasColumns('users', [
            'name',
            'email_verified_at',
            'remember_token',
            'updated_at',
        ]));
        $this->assertTrue(Schema::hasColumns('sessions', ['id', 'user_id', 'payload', 'last_activity']));
        $this->assertTrue(Schema::hasTable('password_reset_tokens'));
        $this->assertTrue(Schema::hasTable('cache'));
        $this->assertTrue(Schema::hasTable('jobs'));
        $this->assertTrue(Schema::hasTable('personal_access_tokens'));
        $this->assertDatabaseHas('documents', [
            'id' => 'ba2bb395-417d-4f40-9c81-53ae72444d26',
            'filename' => 'preserved.pdf',
            'status' => 'UPLOADED',
        ]);
        $this->assertTrue(Schema::hasColumns('documents', [
            'original_name',
            'extension',
            'mime_type',
            'storage_disk',
            'size_bytes',
            'failure_reason',
            'indexed_at',
        ]));
    }
}
