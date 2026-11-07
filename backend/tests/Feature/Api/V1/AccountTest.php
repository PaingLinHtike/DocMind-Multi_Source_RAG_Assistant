<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AccountTest extends TestCase
{
    use LazilyRefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withHeader('Origin', 'http://localhost:5173');
    }

    public function test_profile_update_changes_name_and_email_without_exposing_password(): void
    {
        $user = User::factory()->create([
            'email' => 'old@example.com',
            'password_hash' => Hash::make('OldPassword123!'),
        ]);
        $this->actingAs($user, 'web');

        $response = $this->patchJson('/api/v1/account/profile', [
            'name' => 'Aung Min',
            'email' => 'aung@example.com',
            'password_hash' => 'must-not-be-assigned',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.name', 'Aung Min')
            ->assertJsonPath('data.email', 'aung@example.com')
            ->assertJsonMissingPath('data.password_hash');
        $user->refresh();
        $this->assertSame('Aung Min', $user->name);
        $this->assertSame('aung@example.com', $user->email);
        $this->assertTrue(Hash::check('OldPassword123!', $user->password_hash));
    }

    public function test_profile_update_returns_422_for_another_users_email(): void
    {
        $user = User::factory()->create(['email' => 'owner@example.com']);
        User::factory()->create(['email' => 'taken@example.com']);
        $this->actingAs($user, 'web');

        $response = $this->patchJson('/api/v1/account/profile', [
            'name' => 'Owner',
            'email' => 'taken@example.com',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
        $this->assertSame('owner@example.com', $user->refresh()->email);
    }

    public function test_password_update_returns_422_for_wrong_current_password(): void
    {
        $user = User::factory()->create([
            'password_hash' => Hash::make('OldPassword123!'),
        ]);
        $this->actingAs($user, 'web');

        $response = $this->putJson('/api/v1/account/password', [
            'current_password' => 'WrongPassword123!',
            'password' => 'NewPassword456!',
            'password_confirmation' => 'NewPassword456!',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['current_password']);
        $this->assertTrue(Hash::check('OldPassword123!', $user->refresh()->password_hash));
    }

    public function test_password_update_hashes_the_new_password(): void
    {
        $user = User::factory()->create([
            'password_hash' => Hash::make('OldPassword123!'),
        ]);
        $this->actingAs($user, 'web');

        $response = $this->putJson('/api/v1/account/password', [
            'current_password' => 'OldPassword123!',
            'password' => 'NewPassword456!',
            'password_confirmation' => 'NewPassword456!',
        ]);

        $response->assertNoContent();
        $this->assertTrue(Hash::check('NewPassword456!', $user->refresh()->password_hash));
    }
}
