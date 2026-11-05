<?php

namespace App\Modules\Products\Http\Controllers;

use App\Modules\Products\Http\Requests\IndexProductsRequest;
use App\Modules\Products\Http\Requests\StoreProductRequest;
use App\Modules\Products\Http\Requests\UpdateProductRequest;
use App\Modules\Products\Http\Requests\UploadProductImageRequest;
use App\Modules\Products\Http\Resources\ProductResource;
use App\Modules\Products\Models\Product;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

class ProductController
{
    public function index(IndexProductsRequest $request)
    {
        $sort = $request->input('sort', '-created_at');
        $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
        $column = ltrim($sort, '-');

        $products = Product::query()
            ->when($request->filled('category'), fn ($q) => $q->where('category', $request->input('category')))
            ->when($request->filled('q'), fn ($q) => $q->where('name', 'like', '%'.addcslashes($request->input('q'), '%_\\').'%'))
            ->orderBy($column, $direction)
            ->orderBy('id')
            ->paginate((int) $request->input('per_page', 15))
            ->withQueryString();

        return ProductResource::collection($products);
    }

    public function show(Product $product): ProductResource
    {
        return new ProductResource($product);
    }

    public function store(StoreProductRequest $request)
    {
        $product = Product::create($request->safe()->only(['name', 'description', 'price', 'category']));

        if ($request->hasFile('image')) {
            // store() بيولّد اسم عشوائي: اسم الملف اللي بيبعته العميل ما بنستخدمه أبداً
            $product->image_path = $request->file('image')->store('products', 'public');
            $product->save();
        }

        return (new ProductResource($product))->response()->setStatusCode(201);
    }

    public function update(UpdateProductRequest $request, Product $product): ProductResource
    {
        $product->update($request->validated());

        return new ProductResource($product);
    }

    // endpoint منفصل لأنو PHP ما بيقرأ multipart على PUT/PATCH
    public function uploadImage(UploadProductImageRequest $request, Product $product): ProductResource
    {
        $this->deleteImage($product);
        $product->image_path = $request->file('image')->store('products', 'public');
        $product->save();

        return new ProductResource($product);
    }

    public function destroy(Product $product): Response
    {
        Gate::authorize('delete', $product);

        $this->deleteImage($product);
        $product->delete();

        return response()->noContent();
    }

    private function deleteImage(Product $product): void
    {
        if ($product->image_path) {
            /** @var FilesystemAdapter $disk */
            $disk = Storage::disk('public');
            $disk->delete($product->image_path);
        }
    }
}