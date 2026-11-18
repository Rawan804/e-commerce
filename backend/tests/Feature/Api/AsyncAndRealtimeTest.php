<?php

namespace Tests\Feature\Api;

use App\Modules\Notifications\Listeners\SendOrderConfirmationEmail;
use App\Modules\Notifications\Mail\OrderConfirmationMail;
use App\Modules\Orders\Events\OrderPlaced;
use App\Modules\Realtime\Support\ChannelAuthorizer;
use Illuminate\Events\CallQueuedListener;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;

/** المتطلب الرابع: الطابور (البريد) + صلاحيات القنوات اللحظية */
class AsyncAndRealtimeTest extends ApiTestCase
{
    public function test_placing_an_order_sends_the_confirmation_email_through_the_listener(): void
    {
        Mail::fake();
        $customer = $this->makeUser();

        $orderId = $this->placeOrder($customer);

        Mail::assertSent(OrderConfirmationMail::class, fn ($m) => $m->hasTo($customer->email) && $m->order->id === $orderId);
    }

    public function test_the_email_listener_is_pushed_to_the_emails_queue_not_run_inline(): void
    {
        config(['queue.mail_connection' => 'database']);   // أي اتصال غير sync
        Queue::fake();
        Mail::fake();

        $this->placeOrder($this->makeUser());

        Queue::assertPushedOn('emails', CallQueuedListener::class,
            fn ($job) => $job->class === SendOrderConfirmationEmail::class);
        Mail::assertNothingSent(); // الرد رجع للزبون قبل ما يتبعت أي بريد
    }

    public function test_redelivered_message_does_not_send_a_second_email(): void
    {
        Mail::fake();
        $customer = $this->makeUser();
        $orderId = $this->placeOrder($customer);   // أول إرسال (inline بالاختبار)

        // نفس الرسالة انعادت (مثلاً العامل وقع قبل ack)
        (new SendOrderConfirmationEmail())->handle(new OrderPlaced($orderId, $customer->id, '21.00'));

        Mail::assertSent(OrderConfirmationMail::class, 1);
    }

    public function test_failed_mail_throws_so_the_message_is_retried_and_not_marked_as_sent(): void
    {
        $customer = $this->makeUser();
        $orderId = $this->placeOrder($customer);
        Cache::flush();

        Mail::shouldReceive('to')->andThrow(new \RuntimeException('SMTP down'));

        $this->expectException(\RuntimeException::class);
        try {
            (new SendOrderConfirmationEmail())->handle(new OrderPlaced($orderId, $customer->id, '21.00'));
        } finally {
            $this->assertFalse(Cache::has("mail:order-confirmation:{$orderId}"));
        }
    }

    public function test_only_admins_can_join_the_admin_orders_channel(): void
    {
        $this->assertTrue(ChannelAuthorizer::canJoinAdminOrders($this->makeUser('admin')));
        $this->assertFalse(ChannelAuthorizer::canJoinAdminOrders($this->makeUser('customer')));
    }

    public function test_only_the_owner_can_join_an_order_channel(): void
    {
        $owner = $this->makeUser();
        $other = $this->makeUser();
        $admin = $this->makeUser('admin');
        $orderId = $this->placeOrder($owner);

        $this->assertTrue(ChannelAuthorizer::canJoinOrder($owner, $orderId));
        $this->assertFalse(ChannelAuthorizer::canJoinOrder($other, $orderId));
        $this->assertFalse(ChannelAuthorizer::canJoinOrder($admin, $orderId)); // الأدمن عنده قناته الخاصة
    }
}
