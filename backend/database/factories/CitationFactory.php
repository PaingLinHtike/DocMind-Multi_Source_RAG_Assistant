<?php

namespace Database\Factories;

use App\Models\Citation;
use App\Models\Document;
use App\Models\Message;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Citation>
 */
class CitationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'message_id' => Message::factory(),
            'document_id' => Document::factory(),
            'chunk_id' => (string) fake()->uuid(),
            'page_number' => fake()->numberBetween(1, 100),
            'citation_number' => 1,
            'snippet' => fake()->paragraph(),
        ];
    }
}
