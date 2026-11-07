<?php

namespace App\Http\Controllers\Api\V1\Account;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Account\UpdateProfileRequest;
use App\Http\Resources\Api\V1\UserResource;

class ProfileController extends Controller
{
    public function __invoke(UpdateProfileRequest $request): UserResource
    {
        $user = $request->user();
        $user->update($request->safe()->only('name', 'email'));

        return new UserResource($user->refresh());
    }
}
