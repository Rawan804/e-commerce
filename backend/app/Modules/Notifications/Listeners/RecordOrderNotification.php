<?php

namespace App\Modules\Notifications\Listeners;

use App\Modules\Notifications\Models\UserNotification;
use App\Modules\Orders\Events\OrderPlaced;
use App\Modules\Orders\Events\OrderStatusChanged;

/** بتتفاعل مع أحداث الطلبات بدون ما تقرأ جداولها */
class RecordOrderNotification
{
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