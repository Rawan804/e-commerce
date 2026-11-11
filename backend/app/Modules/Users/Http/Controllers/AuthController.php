<?php

namespace App\Modules\Users\Http\Controllers;

use App\Modules\Shared\Exceptions\ApiException;
use App\Modules\Users\Http\Requests\LoginRequest;
use App\Modules\Users\Http\Requests\RegisterRequest;
use App\Modules\Users\Http\Resources\UserResource;
use App\Modules\Users\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use PHPOpenSourceSaver\JWTAuth\JWTGuard;

class AuthController
{
   
public function register(RegisterRequest $request): JsonResponse
{
    $user = new User($request->validated());

    // تعيين الدور الافتراضي من جهة السيرفر فقط
    $user->role = User::ROLE_CUSTOMER;
    $user->save();

    $token = $this->guard()->login($user);

    return response()->json(['data' => [
        'user' => new UserResource($user->refresh()),
        ...$this->tokenPayload($token),
    ]], 201);
}

    public function login(LoginRequest $request): JsonResponse
    {
        $token = $this->guard()->attempt($request->validated());

        if (! $token) {
            // نفس الرسالة لـ "إيميل غلط" و"باسورد غلط" (بدون كشف وجود المستخدم)
            throw new ApiException(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
        }

        $user = $this->guard()->user();

        return response()->json(['data' => [
            'user' => new UserResource($user),
            ...$this->tokenPayload($token),
        ]]);
    }

    public function refresh(): JsonResponse
    {
        return response()->json(['data' => $this->tokenPayload($this->guard()->refresh())]);
    }

    public function logout(): Response
    {
        $this->guard()->logout(); // التوكن بينحط بالقائمة السوداء

        return response()->noContent();
    }

    private function tokenPayload(string $token): array
    {
        return [
            'access_token' => $token,
            'token_type' => 'Bearer',
            'expires_in' => $this->guard()->factory()->getTTL() * 60,
        ];
    }

    private function guard(): JWTGuard
    {
        /** @var JWTGuard $guard */
        $guard = Auth::guard('api');

        return $guard;
    }
}