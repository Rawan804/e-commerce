<?php

return [
    App\Providers\AppServiceProvider::class,
    App\Modules\Shared\Providers\SharedServiceProvider::class,
    App\Modules\Users\Providers\UsersServiceProvider::class,
    App\Modules\Products\Providers\ProductsServiceProvider::class,
    App\Modules\Orders\Providers\OrdersServiceProvider::class,
    App\Modules\Notifications\Providers\NotificationsServiceProvider::class,
];