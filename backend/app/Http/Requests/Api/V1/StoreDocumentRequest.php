<?php

namespace App\Http\Requests\Api\V1;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rules\File;

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
                File::types(['pdf', 'docx', 'txt'])
                    ->max((int) config('docmind.upload_max_kb')),
                'extensions:pdf,docx,txt',
                function (string $attribute, mixed $value, Closure $fail): void {
                    if (! $value instanceof UploadedFile) {
                        return;
                    }

                    $allowedMimeTypes = [
                        'pdf' => ['application/pdf'],
                        'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                        'txt' => ['text/plain'],
                    ];
                    $extension = strtolower($value->getClientOriginalExtension());

                    if (! in_array($value->getMimeType(), $allowedMimeTypes[$extension] ?? [], true)) {
                        $fail('The document extension does not match its content type.');
                    }
                },
            ],
        ];
    }
}
