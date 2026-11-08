<?php

namespace Tests\Feature\Api\V1;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use LazilyRefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withHeader('Origin', 'http://localhost:5173');
    }

    public function test_registration_returns_422_for_invalid_terms_and_password(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Aung',
            'email' => 'aung@example.com',
            'password' => 'weak',
            'password_confirmation' => 'different',
            'terms_accepted' => false,
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['password', 'terms_accepted']);
        $this->assertDatabaseMissing('users', ['email' => 'aung@example.com']);
    }

    public function test_valid_registration_creates_user_and_authenticated_session(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Aung',
            'email' => 'aung@example.com',
            'password' => 'StrongPassword123!',
            'password_confirmation' => 'StrongPassword123!',
            'terms_accepted' => true,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.email', 'aung@example.com')
            ->assertJsonMissingPath('data.password')
            ->assertJsonMissingPath('data.password_hash');
        $this->assertAuthenticated();

        $user = User::query()->where('email', 'aung@example.com')->firstOrFail();
        $this->assertSame('Aung', $user->name);
        $this->assertTrue(Hash::check('StrongPassword123!', $user->password_hash));
    }

    public function test_login_returns_422_for_bad_credentials(): void
    {
        User::factory()->create([
            'email' => 'aung@example.com',
            'password_hash' => Hash::make('StrongPassword123!'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'aung@example.com',
            'password' => 'wrong-password',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
        $this->assertGuest();
    }

    public function test_login_regenerates_the_session(): void
    {
        $user = User::factory()->create([
            'email' => 'aung@example.com',
            'password_hash' => Hash::make('StrongPassword123!'),
        ]);
        $this->withSession(['marker' => 'preserved']);
        $oldSessionId = session()->getId();

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'aung@example.com',
            'password' => 'StrongPassword123!',
        ]);

        $response->assertOk();
        $this->assertAuthenticatedAs($user);
        $this->assertNotSame($oldSessionId, session()->getId());
        $this->assertSame('preserved', session('marker'));
    }

    public function test_current_user_returns_401_without_authentication(): void
    {
        $response = $this->getJson('/api/v1/auth/user');

        $response->assertUnauthorized();
    }

    public function test_logout_invalidates_the_session(): void
    {
        $user = User::factory()->create([
            'email' => 'aung@example.com',
            'password_hash' => Hash::make('StrongPassword123!'),
        ]);
        $this->postJson('/api/v1/auth/login', [
            'email' => 'aung@example.com',
            'password' => 'StrongPassword123!',
        ])->assertOk();
        $this->assertAuthenticatedAs($user);
        $this->withSession(['marker' => 'remove-me']);

        $response = $this->postJson('/api/v1/auth/logout');

        $response->assertNoContent();
        $this->assertGuest('web');
        $this->assertNull(session('marker'));
    }

    public function test_login_returns_429_after_five_failed_attempts(): void
    {
        User::factory()->create([
            'email' => 'aung@example.com',
            'password_hash' => Hash::make('StrongPassword123!'),
        ]);

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $this->postJson('/api/v1/auth/login', [
                'email' => 'aung@example.com',
                'password' => 'wrong-password',
            ])->assertUnprocessable();
        }

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'aung@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertTooManyRequests();
    }

    public function test_forgot_password_sends_reset_notification_and_returns_neutral_response(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'aung@example.com']);

        $response = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'aung@example.com',
        ]);

        $response
            ->assertAccepted()
            ->assertExactJson(['message' => 'If an account exists, a password reset link has been sent.']);
        Notification::assertSentTo(
            $user,
            ResetPassword::class,
            function (ResetPassword $notification) use ($user): bool {
                $resetUrl = $notification->toMail($user)->actionUrl;

                return str_starts_with($resetUrl, 'http://localhost:5173/reset-password?')
                    && str_contains($resetUrl, 'email=aung%40example.com');
            },
        );
    }

    public function test_forgot_password_returns_same_response_for_unknown_email(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'unknown@example.com',
        ]);

        $response
            ->assertAccepted()
            ->assertExactJson(['message' => 'If an account exists, a password reset link has been sent.']);
        Notification::assertNothingSent();
    }

    public function test_valid_token_resets_password_hash(): void
    {
        $user = User::factory()->create([
            'email' => 'aung@example.com',
            'password_hash' => Hash::make('OldPassword123!'),
        ]);
        $token = Password::createToken($user);

        $response = $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'aung@example.com',
            'token' => $token,
            'password' => 'NewPassword456!',
            'password_confirmation' => 'NewPassword456!',
        ]);

        $response->assertOk()->assertExactJson(['message' => 'Password reset.']);
        $this->assertTrue(Hash::check('NewPassword456!', $user->refresh()->password_hash));
    }
}
