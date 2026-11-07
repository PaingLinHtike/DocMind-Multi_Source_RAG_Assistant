<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void {}

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ResetPassword::createUrlUsing(function (User $user, string $token): string {
            $query = http_build_query([
                'token' => $token,
                'email' => $user->email,
            ], encoding_type: PHP_QUERY_RFC3986);

            return rtrim((string) config('docmind.frontend_url'), '/').'/reset-password?'.$query;
        });

        RateLimiter::for('login', function (Request $request): Limit {
            $email = $request->string('email')->lower()->ascii()->toString();

            return Limit::perMinute(5)->by($email.'|'.$request->ip());
        });

        RateLimiter::for('password-reset', function (Request $request): Limit {
            $email = $request->string('email')->lower()->ascii()->toString();

            return Limit::perMinute(3)->by($email.'|'.$request->ip());
        });

        RateLimiter::for('uploads', function (Request $request): Limit {
            return Limit::perMinute(10)->by(
                (string) ($request->user()?->getAuthIdentifier() ?? $request->ip()),
            );
        });
    }
}
