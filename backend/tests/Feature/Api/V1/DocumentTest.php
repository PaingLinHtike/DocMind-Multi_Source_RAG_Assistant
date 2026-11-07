<?php

namespace Tests\Feature\Api\V1;

use App\Models\Document;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class DocumentTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_authenticated_user_uploads_pdf_as_pending(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/v1/documents', [
            'document' => UploadedFile::fake()->create('research.pdf', 100, 'application/pdf'),
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.name', 'research.pdf')
            ->assertJsonPath('data.type', 'PDF')
            ->assertJsonPath('data.status', 'pending');

        $document = DB::table('documents')->where('user_id', $user->id)->first();
        $this->assertNotNull($document);
        $this->assertSame('PENDING', $document->status);
        $this->assertStringStartsWith("documents/{$user->id}/", $document->storage_key);
        Storage::disk('local')->assertExists($document->storage_key);
        Storage::disk('public')->assertMissing($document->storage_key);
    }

    /**
     * @return array<string, array{string, string, string}>
     */
    public static function supportedUploads(): array
    {
        return [
            'PDF' => ['report.pdf', 'application/pdf', 'PDF'],
            'DOCX' => ['notes.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'DOCX'],
            'TXT' => ['plain.txt', 'text/plain', 'TXT'],
        ];
    }

    #[DataProvider('supportedUploads')]
    public function test_upload_accepts_supported_file_types(string $filename, string $mimeType, string $expectedType): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/v1/documents', [
            'document' => UploadedFile::fake()->create($filename, 10, $mimeType),
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.type', $expectedType);
        $this->assertDatabaseHas('documents', [
            'user_id' => $user->id,
            'filename' => $filename,
            'source_type' => strtolower($expectedType),
        ]);
    }

    public function test_upload_rejects_unsupported_extension(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/v1/documents', [
            'document' => UploadedFile::fake()->create('malware.exe', 10, 'application/octet-stream'),
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['document']);
        $this->assertDatabaseCount('documents', 0);
        Storage::disk('local')->assertDirectoryEmpty('/');
    }

    public function test_upload_rejects_spoofed_extension_mime_pair_without_storing_file(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/v1/documents', [
            'document' => UploadedFile::fake()->create('spoofed.pdf', 10, 'text/plain'),
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['document']);
        $this->assertDatabaseCount('documents', 0);
        Storage::disk('local')->assertDirectoryEmpty('/');
    }

    public function test_upload_rejects_oversized_file(): void
    {
        Storage::fake('local');
        config()->set('docmind.upload_max_kb', 1);
        $user = User::factory()->create();
        $this->actingAs($user, 'web');

        $response = $this->postJson('/api/v1/documents', [
            'document' => UploadedFile::fake()->create('large.pdf', 2, 'application/pdf'),
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['document']);
        $this->assertDatabaseCount('documents', 0);
    }

    public function test_guest_upload_returns_401(): void
    {
        Storage::fake('local');

        $response = $this->postJson('/api/v1/documents', [
            'document' => UploadedFile::fake()->create('research.pdf', 10, 'application/pdf'),
        ]);

        $response->assertUnauthorized();
        $this->assertDatabaseCount('documents', 0);
    }

    public function test_upload_returns_429_after_ten_requests_per_minute(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $this->actingAs($user, 'web');

        for ($request = 1; $request <= 10; $request++) {
            $this->postJson('/api/v1/documents', [
                'document' => UploadedFile::fake()->create("research-{$request}.pdf", 10, 'application/pdf'),
            ])->assertCreated();
        }

        $response = $this->postJson('/api/v1/documents', [
            'document' => UploadedFile::fake()->create('limited.pdf', 10, 'application/pdf'),
        ]);

        $response->assertTooManyRequests();
        $this->assertDatabaseCount('documents', 10);
    }

    public function test_index_returns_paginated_documents_for_only_the_authenticated_user(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        Document::factory()->count(15)->for($user)->create();
        Document::factory()->for($otherUser)->create(['filename' => 'hidden.pdf']);
        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/v1/documents');

        $response
            ->assertOk()
            ->assertJsonCount(10, 'data')
            ->assertJsonPath('meta.total', 15)
            ->assertJsonMissing(['name' => 'hidden.pdf']);
    }

    public function test_search_is_case_insensitive_and_user_scoped(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        Document::factory()->for($user)->create(['filename' => 'Quarterly REPORT.pdf']);
        Document::factory()->for($user)->create(['filename' => 'notes.txt', 'extension' => 'txt', 'source_type' => 'txt']);
        Document::factory()->for($otherUser)->create(['filename' => 'Private Report.pdf']);
        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/v1/documents?search=report');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Quarterly REPORT.pdf');
    }

    public function test_show_returns_document_details(): void
    {
        $user = User::factory()->create();
        $document = Document::factory()->for($user)->create([
            'filename' => 'research.pdf',
            'chunk_count' => 12,
            'size_bytes' => 2048,
            'status' => Document::StatusReady,
        ]);
        $this->actingAs($user, 'web');

        $response = $this->getJson("/api/v1/documents/{$document->id}");

        $response
            ->assertOk()
            ->assertJsonPath('data.name', 'research.pdf')
            ->assertJsonPath('data.status', 'ready')
            ->assertJsonPath('data.chunks', 12)
            ->assertJsonPath('data.size_bytes', 2048);
    }

    public function test_update_renames_only_document_metadata(): void
    {
        $user = User::factory()->create();
        $document = Document::factory()->for($user)->create([
            'filename' => 'old.pdf',
            'status' => Document::StatusReady,
        ]);
        $this->actingAs($user, 'web');

        $response = $this->patchJson("/api/v1/documents/{$document->id}", [
            'name' => 'renamed.pdf',
            'status' => Document::StatusFailed,
            'storage_key' => 'tampered/path.pdf',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.name', 'renamed.pdf')
            ->assertJsonPath('data.status', 'ready');
        $document->refresh();
        $this->assertSame('renamed.pdf', $document->filename);
        $this->assertSame(Document::StatusReady, $document->status);
        $this->assertNotSame('tampered/path.pdf', $document->storage_key);
    }

    public function test_content_returns_inline_private_file(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $document = Document::factory()->for($user)->create([
            'filename' => 'research.pdf',
            'storage_key' => "documents/{$user->id}/research.pdf",
        ]);
        Storage::disk('local')->put($document->storage_key, 'private-content');
        $this->actingAs($user, 'web');

        $response = $this->get("/api/v1/documents/{$document->id}/content");

        $response
            ->assertOk()
            ->assertStreamedContent('private-content')
            ->assertHeaderContains('content-disposition', 'inline;');
    }

    public function test_download_returns_private_file_as_attachment(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $document = Document::factory()->for($user)->create([
            'filename' => 'research.pdf',
            'storage_key' => "documents/{$user->id}/research.pdf",
        ]);
        Storage::disk('local')->put($document->storage_key, 'private-content');
        $this->actingAs($user, 'web');

        $response = $this->get("/api/v1/documents/{$document->id}/download");

        $response
            ->assertOk()
            ->assertStreamedContent('private-content')
            ->assertHeaderContains('content-disposition', 'attachment;');
    }

    public function test_delete_removes_document_row_and_private_file(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $document = Document::factory()->for($user)->create([
            'storage_key' => "documents/{$user->id}/delete.pdf",
        ]);
        Storage::disk('local')->put($document->storage_key, 'delete-me');
        $this->actingAs($user, 'web');

        $response = $this->deleteJson("/api/v1/documents/{$document->id}");

        $response->assertNoContent();
        $this->assertDatabaseMissing('documents', ['id' => $document->id]);
        Storage::disk('local')->assertMissing($document->storage_key);
    }

    public function test_recent_uploads_returns_latest_documents_for_only_the_user(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        Document::factory()->for($user)->create([
            'filename' => 'older.pdf',
            'created_at' => now()->subDay(),
        ]);
        Document::factory()->for($user)->create([
            'filename' => 'newer.pdf',
            'created_at' => now(),
        ]);
        Document::factory()->for($otherUser)->create(['filename' => 'hidden.pdf']);
        $this->actingAs($user, 'web');

        $response = $this->getJson('/api/v1/uploads/recent');

        $response
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.name', 'newer.pdf')
            ->assertJsonPath('data.1.name', 'older.pdf')
            ->assertJsonMissing(['name' => 'hidden.pdf']);
    }

    public function test_reindex_resets_processing_metadata(): void
    {
        $user = User::factory()->create();
        $document = Document::factory()->for($user)->create([
            'status' => Document::StatusFailed,
            'chunk_count' => 42,
            'failure_reason' => 'Parser failed.',
            'indexed_at' => now(),
        ]);
        $this->actingAs($user, 'web');

        $response = $this->postJson("/api/v1/documents/{$document->id}/reindex");

        $response
            ->assertAccepted()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.chunks', null);
        $document->refresh();
        $this->assertSame(Document::StatusPending, $document->status);
        $this->assertSame(0, $document->chunk_count);
        $this->assertNull($document->failure_reason);
        $this->assertNull($document->indexed_at);
    }

    /**
     * @return array<string, array{string, string, array<string, string>}>
     */
    public static function crossUserActions(): array
    {
        return [
            'read' => ['GET', '', []],
            'rename' => ['PATCH', '', ['name' => 'stolen.pdf']],
            'content' => ['GET', '/content', []],
            'download' => ['GET', '/download', []],
            'reindex' => ['POST', '/reindex', []],
            'delete' => ['DELETE', '', []],
        ];
    }

    /**
     * @param  array<string, string>  $payload
     */
    #[DataProvider('crossUserActions')]
    public function test_cross_user_document_action_returns_404(string $method, string $suffix, array $payload): void
    {
        Storage::fake('local');
        $owner = User::factory()->create();
        $attacker = User::factory()->create();
        $document = Document::factory()->for($owner)->create();
        Storage::disk('local')->put($document->storage_key, 'private-content');
        $this->actingAs($attacker, 'web');

        $response = $this->json($method, "/api/v1/documents/{$document->id}{$suffix}", $payload);

        $response->assertNotFound();
        $this->assertDatabaseHas('documents', ['id' => $document->id]);
        Storage::disk('local')->assertExists($document->storage_key);
    }
}
