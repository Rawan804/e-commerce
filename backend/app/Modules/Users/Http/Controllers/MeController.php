<?php

namespace App\Modules\Users\Http\Controllers;

use App\Modules\Users\Http\Resources\UserResource;
use Illuminate\Http\Request;

class MeController
{
    public function __invoke(Request $request): UserResource
    {
        return new UserResource($request->user());
    }
}