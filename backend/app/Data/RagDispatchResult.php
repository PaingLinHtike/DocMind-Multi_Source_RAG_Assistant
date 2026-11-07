<?php

namespace App\Data;

final readonly class RagDispatchResult
{
    public function __construct(
        public bool $accepted,
        public string $status,
    ) {}
}
