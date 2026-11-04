<?php

use App\Modules\Products\Http\Controllers\ProductController;
use Illuminate\Support\Facades\Route;

// عامة: أي حدا بيقدر يتصفح المنتجات
Route::get('products', [ProductController::class, 'index']);
Route::get('products/{product}', [ProductController::class, 'show'])->whereNumber('product');

// للأدمن فقط (الـ ProductPolicy هي اللي بتفرض هالشي)
Route::middleware('auth:api')->group(function () {
    Route::post('products', [ProductController::class, 'store']);
    Route::put('products/{product}', [ProductController::class, 'update'])->whereNumber('product');
    Route::post('products/{product}/image', [ProductController::class, 'uploadImage'])->whereNumber('product');
    Route::delete('products/{product}', [ProductController::class, 'destroy'])->whereNumber('product');
});