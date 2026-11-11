<?php

namespace App\Modules\Products\Http\Resources;

use App\Services\WarehouseGrpcService;
use Illuminate\Http\Resources\Json\JsonResource;
use Throwable;

class ProductResource extends JsonResource
{
    public function toArray($request): array
    {
        // Stock comes from the warehouse. Degrade gracefully: if the warehouse fails (down or
        // too slow) we stop asking it for the rest of THIS request, so a list of N products
        // costs at most one short timeout instead of N of them.
        $stock = null;
        if (! $request->attributes->get('warehouse_unavailable', false)) {
            try {
                /** @var WarehouseGrpcService $warehouse */
                $warehouse = app(WarehouseGrpcService::class);
                $stock = $warehouse->getStock($this->id);
            } catch (Throwable) {
                $request->attributes->set('warehouse_unavailable', true);
            }
        }

        return [
            'id'             => $this->id,
            'name'           => $this->name,
            'description'    => $this->description,
            'price'          => (string) $this->price,
            'category'       => $this->category,
            // imageUrl() is an accessor method on the Product model
            'image_url'      => $this->imageUrl(),
            'stock_quantity' => $stock,
            'created_at'     => $this->created_at?->toIso8601String(),
            'updated_at'     => $this->updated_at?->toIso8601String(),
        ];
    }
}