<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * بيحدد كمية منتج بالمستودع عبر واجهة HTTP الداخلية (admin_http.py).
 * الصلاحية (أدمن فقط) بتنفرض بالـ Request/Policy قبل ما نوصل لهون.
 */
class WarehouseAdminService
{
    public function setStock(int $productId, int $quantity): void
    {
        $url = rtrim((string) config('services.warehouse.admin_url'), '/')."/stock/{$productId}";

        $response = Http::timeout(5)
            ->connectTimeout(2)
            ->acceptJson()
            ->withHeaders(['X-Admin-Key' => (string) config('services.warehouse.admin_key')])
            ->put($url, ['quantity' => $quantity]);

        if ($response->failed()) {
            throw new RuntimeException("Warehouse admin API error: HTTP {$response->status()}");
        }
    }
}
