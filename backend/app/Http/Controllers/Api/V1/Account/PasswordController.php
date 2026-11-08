<?php

namespace App\Http\Controllers\Api\V1\Account;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Account\UpdatePasswordRequest;
use Illuminate\Http\Response;

class PasswordController extends Controller
{
    public function __invoke(UpdatePasswordRequest $request): Response
    {
        $request->user()->update([
            'password_hash' => $request->string('password')->toString(),
        ]);

        return response()->noContent();
    }
}
