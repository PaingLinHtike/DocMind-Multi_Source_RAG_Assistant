<?php

use App\Http\Controllers\Api\V1\Account\PasswordController;
use App\Http\Controllers\Api\V1\Account\ProfileController;
use App\Http\Controllers\Api\V1\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Api\V1\Auth\NewPasswordController;
use App\Http\Controllers\Api\V1\Auth\PasswordResetLinkController;
use App\Http\Controllers\Api\V1\Auth\RegisteredUserController;
use App\Http\Controllers\Api\V1\ConversationController;
use App\Http\Controllers\Api\V1\ConversationMessageController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\DocumentContentController;
use App\Http\Controllers\Api\V1\DocumentController;
use App\Http\Controllers\Api\V1\DocumentIndexController;
use App\Http\Controllers\Api\V1\RecentUploadController;
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

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/dashboard', DashboardController::class)
            ->name('api.v1.dashboard');
        Route::post('/conversations/{conversation}/messages', ConversationMessageController::class)
            ->middleware('throttle:messages')
            ->name('api.v1.conversations.messages.store');
        Route::apiResource('conversations', ConversationController::class);
        Route::apiResource('documents', DocumentController::class)
            ->except('store');
        Route::post('/documents', [DocumentController::class, 'store'])
            ->middleware('throttle:uploads')
            ->name('api.v1.documents.store');
        Route::get('/documents/{document}/content', [DocumentContentController::class, 'show'])
            ->name('api.v1.documents.content');
        Route::get('/documents/{document}/download', [DocumentContentController::class, 'download'])
            ->name('api.v1.documents.download');
        Route::post('/documents/{document}/index', [DocumentIndexController::class, 'store'])
            ->name('api.v1.documents.index.store');
        Route::delete('/documents/{document}/index', [DocumentIndexController::class, 'destroy'])
            ->name('api.v1.documents.index.destroy');
        Route::get('/uploads/recent', RecentUploadController::class)
            ->name('api.v1.uploads.recent');
    });
});
