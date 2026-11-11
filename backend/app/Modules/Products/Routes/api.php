<?php

use App\Modules\Products\Http\Controllers\ProductController;
use App\Modules\Shared\Http\Middleware\ConditionalGet;
use Illuminate\Support\Facades\Route;

// عامة: أي حدا بيقدر يتصفح المنتجات
Route::get('products/featured', [ProductController::class, 'featured'])->middleware(ConditionalGet::class); // قبل {product} لتجنب التعارض
Route::get('products', [ProductController::class, 'index'])->middleware(ConditionalGet::class);
Route::get('products/{product}', [ProductController::class, 'show'])->whereNumber('product')->middleware(ConditionalGet::class);

// للأدمن فقط (الـ ProductPolicy هي اللي بتفرض هالشي)
Route::middleware('auth:api')->group(function () {
    Route::post('products', [ProductController::class, 'store']);
    Route::put('products/{product}', [ProductController::class, 'update'])->whereNumber('product');
    Route::put('products/{product}/stock', [ProductController::class, 'setStock'])
    ->whereNumber('product');
    Route::post('products/{product}/image', [ProductController::class, 'uploadImage'])->whereNumber('product');
    Route::delete('products/{product}', [ProductController::class, 'destroy'])->whereNumber('product');
});