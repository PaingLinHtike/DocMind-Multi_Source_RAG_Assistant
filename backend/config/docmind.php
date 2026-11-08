<?php

return [
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),

    'upload_max_kb' => (int) env('DOCMIND_UPLOAD_MAX_KB', 20480),

    'fastapi' => [
        'base_url' => env('FASTAPI_BASE_URL', 'http://127.0.0.1:8001'),
        'timeout' => (int) env('FASTAPI_TIMEOUT', 30),
    ],
];
