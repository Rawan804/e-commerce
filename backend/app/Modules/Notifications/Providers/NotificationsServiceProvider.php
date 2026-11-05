<?php

namespace App\Modules\Notifications\Providers;

use App\Modules\Notifications\Listeners\RecordOrderNotification;
use App\Modules\Notifications\Models\UserNotification;
use App\Modules\Notifications\Policies\NotificationPolicy;
use App\Modules\Orders\Events\OrderPlaced;
use App\Modules\Orders\Events\OrderStatusChanged;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class NotificationsServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/../Database/Migrations');
        Gate::policy(UserNotification::class, NotificationPolicy::class);

        // متزامن حالياً؛ بالمتطلب الرابع (المعالجة غير المتزامنة) بينتقل لطابور
        Event::listen(OrderPlaced::class, [RecordOrderNotification::class, 'handlePlaced']);
        Event::listen(OrderStatusChanged::class, [RecordOrderNotification::class, 'handleStatusChanged']);

        Route::middleware('api')->prefix('api/v1')->group(__DIR__.'/../Routes/api.php');
    }
}