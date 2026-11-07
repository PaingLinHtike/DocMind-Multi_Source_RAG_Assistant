<?php

namespace Database\Factories;

use App\Models\Document;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Document>
 */
class DocumentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'user_id' => User::factory(),
            'filename' => fake()->words(3, true).'.pdf',
            'original_name' => fake()->words(3, true).'.pdf',
            'extension' => 'pdf',
            'mime_type' => 'application/pdf',
            'source_type' => 'pdf',
            'storage_disk' => 'local',
            'storage_key' => 'documents/'.Str::uuid().'/'.Str::uuid().'.pdf',
            'status' => Document::StatusPending,
            'chunk_count' => 0,
            'size_bytes' => fake()->numberBetween(1024, 5 * 1024 * 1024),
        ];
    }
}
