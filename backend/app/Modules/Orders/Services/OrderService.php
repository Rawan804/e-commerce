<?php

namespace App\Modules\Orders\Services;

use App\Modules\Orders\Enums\OrderStatus;
use App\Modules\Orders\Events\OrderPlaced;
use App\Modules\Orders\Events\OrderStatusChanged;
use App\Modules\Orders\Models\Order;
use App\Modules\Products\Contracts\ProductCatalog;
use App\Modules\Shared\Exceptions\ApiException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    // بنطلب المنتجات من الواجهة العامة، مش من جدول products مباشرة
    public function __construct(private readonly ProductCatalog $catalog) {}

    /** @param  array<int, array{product_id:int, quantity:int}>  $items */
    public function place(int $userId, array $items): Order
    {
        $ids = array_map(fn ($i) => (int) $i['product_id'], $items);
        $products = $this->catalog->findByIds($ids);

        $missing = array_values(array_diff($ids, array_keys($products)));
        if ($missing) {
            throw ValidationException::withMessages([
                'items' => ['Unknown product id(s): '.implode(', ', $missing)],
            ]);
        }

        $order = DB::transaction(function () use ($userId, $items, $products) {
            $totalCents = 0;
            $rows = [];

            foreach ($items as $item) {
                $product = $products[(int) $item['product_id']];
                $qty = (int) $item['quantity'];
                $totalCents += (int) round(((float) $product['price']) * 100) * $qty;

                // السعر والاسم بيجوا من الكتالوج، مش من العميل
                $rows[] = [
                    'product_id' => $product['id'],
                    'product_name' => $product['name'],
                    'unit_price' => $product['price'],
                    'quantity' => $qty,
                ];
            }

            $order = Order::create([
                'user_id' => $userId,
                'status' => OrderStatus::Pending,
                'total' => number_format($totalCents / 100, 2, '.', ''),
            ]);
            $order->items()->createMany($rows);

            return $order;
        });

        event(new OrderPlaced($order->id, $userId, (string) $order->total));

        return $order->load('items');
    }

    public function changeStatus(Order $order, OrderStatus $next): Order
    {
        $current = $order->status;

        if (! $current->canTransitionTo($next)) {
            throw new ApiException(422, 'INVALID_STATUS_TRANSITION',
                "Cannot change status from '{$current->value}' to '{$next->value}'.");
        }

        $order->update(['status' => $next]);

        event(new OrderStatusChanged($order->id, (int) $order->user_id, $current->value, $next->value));

        return $order->load('items');
    }
}