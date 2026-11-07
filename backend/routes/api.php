<?php

use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('/health', fn (): array => [
        'data' => ['status' => 'ok'],
    ])->name('api.v1.health');
});
