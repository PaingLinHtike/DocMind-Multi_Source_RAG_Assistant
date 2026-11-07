<?php

namespace App\Providers;

use App\Contracts\RagGateway;
use App\Services\PendingRagGateway;
use Illuminate\Support\ServiceProvider;

class DocMindServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->bind(RagGateway::class, PendingRagGateway::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void {}
}
