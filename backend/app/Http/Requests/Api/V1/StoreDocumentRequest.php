<?php

namespace App\Http\Requests\Api\V1;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use ZipArchive;

class StoreDocumentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'document' => [
                'required',
                'file',
                'max:'.(int) config('docmind.upload_max_kb'),
                'extensions:pdf,docx,txt',
                function (string $attribute, mixed $value, Closure $fail): void {
                    if (! $value instanceof UploadedFile) {
                        return;
                    }

                    $allowedMimeTypes = [
                        'pdf' => ['application/pdf'],
                        'txt' => ['text/plain'],
                    ];
                    $extension = strtolower($value->getClientOriginalExtension());

                    if ($extension === 'docx') {
                        $docxMimeTypes = [
                            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                            'application/zip',
                            'application/x-zip-compressed',
                        ];

                        if (! in_array($value->getMimeType(), $docxMimeTypes, true)
                            || ! $this->hasDocxStructure($value)) {
                            $fail('The document is not a valid DOCX file.');
                        }

                        return;
                    }

                    if (! in_array($value->getMimeType(), $allowedMimeTypes[$extension] ?? [], true)) {
                        $fail('The document extension does not match its content type.');
                    }
                },
            ],
        ];
    }

    /**
     * Get the validation error messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'document.uploaded' => 'The document could not be uploaded because it exceeds the server upload limit.',
        ];
    }

    private function hasDocxStructure(UploadedFile $file): bool
    {
        $archive = new ZipArchive;

        if ($archive->open($file->getRealPath()) !== true) {
            return false;
        }

        $hasRequiredEntries = $archive->locateName('[Content_Types].xml') !== false
            && $archive->locateName('word/document.xml') !== false;
        $archive->close();

        return $hasRequiredEntries;
    }
}
