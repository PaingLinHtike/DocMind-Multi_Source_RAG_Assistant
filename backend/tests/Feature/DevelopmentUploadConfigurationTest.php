<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class DevelopmentUploadConfigurationTest extends TestCase
{
    public function test_dev_server_accepts_the_document_upload_limit(): void
    {
        Artisan::call('dev:list', ['--json' => true]);
        $commands = collect(json_decode(Artisan::output(), true, flags: JSON_THROW_ON_ERROR));
        $server = $commands->firstWhere('name', 'server');

        $this->assertSame(
            'php -d upload_max_filesize=20M -d post_max_size=21M -d upload_tmp_dir=storage/app/private artisan serve',
            $server['command'],
        );
    }

    public function test_postgres_sessions_use_utc_to_match_the_application_clock(): void
    {
        $this->assertSame('UTC', config('database.connections.pgsql.timezone'));
    }
}
