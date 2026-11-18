<?php

namespace App\Modules\Realtime\Providers;

use App\Modules\Orders\Events\OrderPlaced;
use App\Modules\Orders\Events\OrderStatusChanged;
use App\Modules\Realtime\Listeners\BroadcastOrderEvents;
use App\Modules\Realtime\Support\ChannelAuthorizer;
use App\Modules\Users\Models\User;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class RealtimeServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Event::listen(OrderPlaced::class, [BroadcastOrderEvents::class, 'handlePlaced']);
        Event::listen(OrderStatusChanged::class, [BroadcastOrderEvents::class, 'handleStatusChanged']);

        // POST /api/v1/broadcasting/auth  — المتصفح بيستدعيه (مع JWT) قبل الاشتراك بأي قناة خاصة
        Broadcast::routes(['prefix' => 'api/v1', 'middleware' => ['api', 'auth:api']]);

        Broadcast::channel('admin.orders', fn (User $user) => ChannelAuthorizer::canJoinAdminOrders($user));
        Broadcast::channel('orders.{orderId}', fn (User $user, int $orderId) => ChannelAuthorizer::canJoinOrder($user, $orderId));
    }
}
