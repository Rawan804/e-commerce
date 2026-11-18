<?php

namespace App\Modules\Realtime\Listeners;

use App\Modules\Orders\Events\OrderPlaced;
use App\Modules\Orders\Events\OrderStatusChanged;
use App\Modules\Orders\Models\Order;
use App\Modules\Realtime\Events\OrderCreatedBroadcast;
use App\Modules\Realtime\Events\OrderStatusBroadcast;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * يحوّل أحداث الطلبات إلى رسائل لحظية عبر Reverb.
 *
 * عن قصد مو بالطابور: البث لازم يوصل فوراً حتى لو الـ Worker واقف.
 * وإذا Reverb واقع ما بنكسر الطلب: بنسجّل الخطأ وبنكمّل.
 */
class BroadcastOrderEvents
{
    public function handlePlaced(OrderPlaced $event): void
    {
        $this->safely('order.placed', $event->orderId, function () use ($event) {
            $order = Order::with(['items', 'user'])->find($event->orderId);
            if ($order) {
                OrderCreatedBroadcast::dispatch($order);
            }
        });
    }

    public function handleStatusChanged(OrderStatusChanged $event): void
    {
        $this->safely('order.status_changed', $event->orderId, function () use ($event) {
            $order = Order::with(['items', 'user'])->find($event->orderId);
            if ($order) {
                OrderStatusBroadcast::dispatch($order, $event->from, $event->to);
            }
        });
    }

    private function safely(string $name, int $orderId, callable $fn): void
    {
        try {
            $fn();
        } catch (Throwable $e) {
            Log::warning("Realtime broadcast '{$name}' failed.", [
                'order_id' => $orderId,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
