<?php

use App\Http\Controllers\Api\V1\Account\PasswordController;
use App\Http\Controllers\Api\V1\Account\ProfileController;
use App\Http\Controllers\Api\V1\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Api\V1\Auth\NewPasswordController;
use App\Http\Controllers\Api\V1\Auth\PasswordResetLinkController;
use App\Http\Controllers\Api\V1\Auth\RegisteredUserController;
use App\Http\Resources\Api\V1\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/health', fn (): array => [
        'data' => ['status' => 'ok'],
    ])->name('api.v1.health');

    Route::prefix('auth')->group(function (): void {
        Route::post('/register', RegisteredUserController::class)
            ->middleware('guest')
            ->name('api.v1.auth.register');
        Route::post('/login', [AuthenticatedSessionController::class, 'store'])
            ->middleware(['guest', 'throttle:login'])
            ->name('api.v1.auth.login');
        Route::post('/forgot-password', PasswordResetLinkController::class)
            ->middleware(['guest', 'throttle:password-reset'])
            ->name('api.v1.auth.forgot-password');
        Route::post('/reset-password', NewPasswordController::class)
            ->middleware(['guest', 'throttle:password-reset'])
            ->name('api.v1.auth.reset-password');

        Route::middleware('auth:sanctum')->group(function (): void {
            Route::get('/user', fn (Request $request): UserResource => new UserResource($request->user()))
                ->name('api.v1.auth.user');
            Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
                ->name('api.v1.auth.logout');
        });
    });

    Route::prefix('account')->middleware('auth:sanctum')->group(function (): void {
        Route::patch('/profile', ProfileController::class)
            ->name('api.v1.account.profile.update');
        Route::put('/password', PasswordController::class)
            ->name('api.v1.account.password.update');
    });
});
