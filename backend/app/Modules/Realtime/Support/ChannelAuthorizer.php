<?php

namespace App\Modules\Realtime\Support;

use App\Modules\Orders\Models\Order;
use App\Modules\Users\Models\User;

/** منطق صلاحيات القنوات (منفصل حتى يتختبر بسهولة) */
final class ChannelAuthorizer
{
    /** قناة لوحة المسؤول: بالدور */
    public static function canJoinAdminOrders(User $user): bool
    {
        return $user->isAdmin();
    }

    /** قناة طلب معيّن: بالملكية (صاحب الطلب فقط) */
    public static function canJoinOrder(User $user, int $orderId): bool
    {
        return Order::query()
            ->whereKey($orderId)
            ->where('user_id', $user->id)
            ->exists();
    }
}
