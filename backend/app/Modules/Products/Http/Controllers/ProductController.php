<?php

namespace App\Modules\Products\Http\Controllers;

use App\Modules\Products\Http\Requests\IndexProductsRequest;
use App\Modules\Products\Http\Requests\StoreProductRequest;
use App\Modules\Products\Http\Requests\UpdateProductRequest;
use App\Modules\Products\Http\Requests\UploadProductImageRequest;
use App\Modules\Products\Http\Resources\ProductResource;
use App\Modules\Products\Services\ProductCache;
use App\Modules\Products\Models\Product;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use App\Modules\Products\Http\Requests\SetProductStockRequest;
use App\Modules\Shared\Exceptions\ApiException;
use App\Services\WarehouseAdminService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProductController
{
    public function __construct(private readonly ProductCache $cache) {}

    public function index(IndexProductsRequest $request)
    {
        $sort = $request->input('sort', '-created_at');
        $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
        $column = ltrim($sort, '-');

        $build = function () use ($request, $column, $direction): string {
            $products = Product::onWriteConnection()
                ->when($request->filled('category'), fn ($q) => $q->where('category', $request->input('category')))
                ->when($request->filled('q'), fn ($q) => $q->where('name', 'like', '%'.addcslashes($request->input('q'), '%_\\').'%'))
                ->orderBy($column, $direction)
                ->orderBy('id', $direction)
                ->paginate((int) $request->input('per_page', 15))
                ->appends($request->validated());

            return ProductResource::collection($products)->response($request)->getContent();
        };

        if ($request->filled('q')) {
            return $this->json($build());
        }

        $params = $request->validated();
        ksort($params);

        return $this->json($this->cache->remember(
            'index:'.md5(json_encode($params)),
            $build,
            fn () => $this->warehouseWasReachable($request),
        ));
    }

    public function featured(Request $request)
    {
        $limit = max(1, min((int) $request->input('limit', 4), 20));

        return $this->json($this->cache->remember(
            "featured:{$limit}",
            function () use ($request, $limit): string {
                $products = Product::onWriteConnection()
                    ->latest('id')
                    ->limit($limit)
                    ->get();

                return ProductResource::collection($products)->response($request)->getContent();
            },
            fn () => $this->warehouseWasReachable($request),
        ));
    }

    public function show(Request $request, int $product)
    {
        $cachedJson = $this->cache->remember(
            "show:{$product}",
            function () use ($request, $product): string {
                $model = Product::onWriteConnection()->findOrFail($product); 

                return (new ProductResource($model))->response($request)->getContent();
            },
            fn () => $this->warehouseWasReachable($request),
        );

        // الـ ETag وردّ 304 بيتولّوا بالـ middleware ConditionalGet (على المسار)
        return $this->json($cachedJson);
    }

    public function store(StoreProductRequest $request)
    {
        $product = Product::create($request->safe()->only(['name', 'description', 'price', 'category']));

        if ($request->hasFile('image')) {
            $product->image_path = $request->file('image')->store('products', 'public');
            $product->save();
        }

        // إبطال الكاش حتى يظهر المنتج الجديد في القائمة فوراً
        $this->cache->flush();

        return (new ProductResource($product))->response()->setStatusCode(201);
    }

    public function update(UpdateProductRequest $request, Product $product): ProductResource
    {
        $product->update($request->validated());

        // إبطال الكاش لتجنب ظهور البيانات القديمة بعد التعديل
        $this->cache->flush();

        return new ProductResource($product);
    }

    public function setStock(
        SetProductStockRequest $request,
        Product $product,
        WarehouseAdminService $warehouse
    ): JsonResponse {
        $quantity = (int) $request->validated('quantity');

        try {
            $warehouse->setStock($product->id, $quantity);
        } catch (Throwable $e) {
            Log::warning('Could not update warehouse stock.', [
                'product_id' => $product->id,
                'error' => $e->getMessage(),
            ]);

            throw new ApiException(
                503,
                'WAREHOUSE_UNAVAILABLE',
                'The inventory service is temporarily unavailable. Please try again.'
            );
        }

        $this->cache->flush();

        return response()->json([
            'data' => [
                'product_id' => $product->id,
                'stock_quantity' => $quantity,
            ],
        ]);
    }

    public function uploadImage(UploadProductImageRequest $request, Product $product): ProductResource
    {
        $this->deleteImage($product);
        $product->image_path = $request->file('image')->store('products', 'public');
        $product->save();

        $this->cache->flush();

        return new ProductResource($product);
    }

    public function destroy(Product $product): Response
    {
        Gate::authorize('delete', $product);

        $this->deleteImage($product);
        $product->delete();

        // إبطال الكاش حتى يختفي المنتج المحذوف من القائمة
        $this->cache->flush();

        return response()->noContent();
    }

    private function json(string $json): \Illuminate\Http\Response
    {
        return response($json, 200, ['Content-Type' => 'application/json']);
    }

    private function warehouseWasReachable(Request $request): bool
    {
        return ! $request->attributes->get('warehouse_unavailable', false);
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