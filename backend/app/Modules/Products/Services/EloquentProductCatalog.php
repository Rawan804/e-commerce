<?php

namespace App\Modules\Products\Services;

use App\Modules\Products\Contracts\ProductCatalog;
use App\Modules\Products\Models\Product;

class EloquentProductCatalog implements ProductCatalog
{
    public function findByIds(array $ids): array
    {
        return Product::query()
            ->whereIn('id', $ids)
            ->get(['id', 'name', 'price'])
            ->mapWithKeys(fn (Product $p) => [$p->id => [
                'id' => $p->id,
                'name' => $p->name,
                'price' => (string) $p->price,
            ]])
            ->all();
    }
}