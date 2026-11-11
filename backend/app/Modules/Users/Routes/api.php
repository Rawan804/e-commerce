<?php

use App\Modules\Users\Http\Controllers\AuthController;
use App\Modules\Users\Http\Controllers\MeController;
use App\Modules\Users\Http\Controllers\UsersController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register'])->middleware('throttle:login');
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:login');

    Route::middleware('auth:api')->group(function () {
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});

Route::get('users/me', [MeController::class, '__invoke'])->middleware('auth:api');
Route::patch('users/me', [MeController::class, 'update'])->middleware('auth:api');

// Admin user management
Route::middleware('auth:api')->prefix('users')->group(function () {
    Route::get('/', [UsersController::class, 'index']);
    Route::delete('{user}', [UsersController::class, 'destroy'])->whereNumber('user');
    Route::patch('{user}/role', [UsersController::class, 'updateRole'])->whereNumber('user');
});
