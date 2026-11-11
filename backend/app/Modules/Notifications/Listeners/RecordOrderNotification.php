<?php

namespace App\Modules\Notifications\Listeners;

use App\Modules\Notifications\Models\UserNotification;
use App\Modules\Orders\Events\OrderPlaced;
use App\Modules\Orders\Events\OrderStatusChanged;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

/** بتتفاعل مع أحداث الطلبات بدون ما تقرأ جداولها */
class RecordOrderNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public int $tries = 5;
    public int $backoff = 30;
    public function handlePlaced(OrderPlaced $event): void
    {
        UserNotification::create([
            'user_id' => $event->userId,
            'type' => 'order.placed',
            'message' => "Your order #{$event->orderId} was placed (total {$event->total}).",
            'data' => ['order_id' => $event->orderId],
        ]);
    }

    public function handleStatusChanged(OrderStatusChanged $event): void
    {
        UserNotification::create([
            'user_id' => $event->userId,
            'type' => 'order.status_changed',
            'message' => "Order #{$event->orderId} status changed: {$event->from} -> {$event->to}.",
            'data' => ['order_id' => $event->orderId, 'from' => $event->from, 'to' => $event->to],
        ]);
    }
}