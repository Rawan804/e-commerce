<?php

namespace App\Modules\Users\Http\Controllers;

use App\Modules\Users\Http\Resources\UserResource;
use Illuminate\Http\Request;

class MeController
{
    /** GET /users/me */
    public function __invoke(Request $request): UserResource
    {
        return new UserResource($request->user());
    }

    /** PATCH /users/me — update own name/email */
    public function update(Request $request): UserResource
    {
        $validated = $request->validate([
            'name'  => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', 'unique:users,email,' . $request->user()->id],
        ]);

        $request->user()->update($validated);

        return new UserResource($request->user()->fresh());
    }
}
