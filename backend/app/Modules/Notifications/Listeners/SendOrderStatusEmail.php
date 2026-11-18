<?php

namespace App\Modules\Notifications\Listeners;

use App\Modules\Notifications\Mail\OrderStatusMail;
use App\Modules\Orders\Events\OrderStatusChanged;
use App\Modules\Orders\Models\Order;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/** بريد تغيّر حالة الطلب عبر RabbitMQ (نفس طابور emails ونفس الـ DLQ) */
class SendOrderStatusEmail implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'emails';
    public int $tries = 5;

    public function viaConnection(): string
    {
        return (string) config('queue.mail_connection', 'rabbitmq');
    }

    public function backoff(): array
    {
        return [10, 30, 60, 120];
    }

    public function handle(OrderStatusChanged $event): void
    {
        $sentKey = "mail:order-status:{$event->orderId}:{$event->from}:{$event->to}";
        if (Cache::has($sentKey)) {
            return;
        }

        $order = Order::with('user')->find($event->orderId);
        if (! $order || ! $order->user?->email) {
            return;
        }

        Mail::to($order->user->email)->send(new OrderStatusMail($order, $event->to));

        Cache::put($sentKey, true, now()->addDays(7));
    }

    public function failed(OrderStatusChanged $event, Throwable $e): void
    {
        Log::error('Order status email failed permanently; message moved to DLQ.', [
            'order_id' => $event->orderId,
            'error' => $e->getMessage(),
        ]);
    }
}
