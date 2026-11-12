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
        if (! Schema::hasColumn('users', 'name')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->string('name')->nullable();
            });
        }

        if (! Schema::hasColumn('users', 'email_verified_at')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->timestampTz('email_verified_at')->nullable();
            });
        }

        if (! Schema::hasColumn('users', 'remember_token')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->rememberToken();
            });
        }

        if (! Schema::hasColumn('users', 'updated_at')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->timestampTz('updated_at')->nullable();
            });
        }
    }

    /**
     * Adopted columns are intentionally retained during rollback.
     */
    public function down(): void {}
};
