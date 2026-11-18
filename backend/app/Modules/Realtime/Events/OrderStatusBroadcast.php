<?php

namespace App\Modules\Realtime\Events;

use App\Modules\Orders\Http\Resources\OrderResource;
use App\Modules\Orders\Models\Order;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/** تغيّر حالة الطلب => صاحب الطلب فقط (قناة خاصة لكل طلب) */
final class OrderStatusBroadcast implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public readonly Order $order,
        public readonly string $from,
        public readonly string $to,
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('orders.'.$this->order->id)];
    }

    public function broadcastAs(): string
    {
        return 'order.status_changed';
    }

    public function broadcastWith(): array
    {
        return [
            'order' => (new OrderResource($this->order))->resolve(),
            'from' => $this->from,
            'to' => $this->to,
        ];
    }
}
