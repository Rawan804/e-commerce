<?php

namespace App\Modules\Notifications\Listeners;

use App\Modules\Notifications\Mail\OrderConfirmationMail;
use App\Modules\Orders\Events\OrderPlaced;
use App\Modules\Orders\Models\Order;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * يرسل بريد تأكيد الطلب عبر RabbitMQ.
 *
 * - الطلب HTTP بس بيحط رسالة بالطابور (سريع) والعامل (container منفصل) بيرسل البريد.
 * - فشل SMTP => إعادة محاولة مع backoff، وبعد آخر محاولة الرسالة بتروح لـ DLQ.
 * - العامل ما بيعمل ack للرسالة إلا بعد ما handle() ينتهي بنجاح.
 */
class SendOrderConfirmationEmail implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'emails';
    public int $tries = 5;

    /** rabbitmq دائماً، إلا بالاختبارات (sync) حتى ما نحتاج وسيط رسائل شغّال */
    public function viaConnection(): string
    {
        return (string) config('queue.mail_connection', 'rabbitmq');
    }

    /** ثواني الانتظار بين المحاولات */
    public function backoff(): array
    {
        return [10, 30, 60, 120];
    }

    public function handle(OrderPlaced $event): void
    {
        // التسليم بـ RabbitMQ هو "مرة على الأقل" (at-least-once): إذا العامل وقع بعد
        // إرسال البريد وقبل ack بتنعاد الرسالة، فهالعلامة بتمنع التكرار بمعظم الحالات.
        $sentKey = "mail:order-confirmation:{$event->orderId}";
        if (Cache::has($sentKey)) {
            return;
        }

        $order = Order::with(['items', 'user'])->find($event->orderId);
        if (! $order || ! $order->user?->email) {
            return; // ما في شي نرسله (طلب انحذف مثلاً)
        }

        Mail::to($order->user->email)->send(new OrderConfirmationMail($order));

        Cache::put($sentKey, true, now()->addDays(7));
    }

    /** بعد استنفاد المحاولات: الرسالة رح تروح لـ DLQ (طابور الرسائل الميتة) */
    public function failed(OrderPlaced $event, Throwable $e): void
    {
        Log::error('Order confirmation email failed permanently; message moved to DLQ.', [
            'order_id' => $event->orderId,
            'error' => $e->getMessage(),
        ]);
    }
}
