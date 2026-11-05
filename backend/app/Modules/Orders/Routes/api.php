<?php

use App\Modules\Orders\Http\Controllers\OrderController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:api')->prefix('orders')->group(function () {
    Route::post('/', [OrderController::class, 'store']);
    Route::get('/', [OrderController::class, 'index']);
    Route::get('{order}', [OrderController::class, 'show'])->whereNumber('order');
    Route::patch('{order}/status', [OrderController::class, 'updateStatus'])->whereNumber('order');
});