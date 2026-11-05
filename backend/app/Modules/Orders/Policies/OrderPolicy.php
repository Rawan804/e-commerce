<?php

namespace App\Modules\Orders\Policies;

use App\Modules\Orders\Models\Order;
use App\Modules\Users\Models\User;

class OrderPolicy
{
    /** الزبون يشوف طلباته بس، والأدمن يشوف الكل */
    public function view(User $user, Order $order): bool
    {
        return $user->isAdmin() || (int) $order->user_id === (int) $user->id;
    }

    public function create(User $user): bool
    {
        return $user->isCustomer();
    }

    /** الأدمن وحده يغيّر حالة الطلب */
    public function updateStatus(User $user, Order $order): bool
    {
        return $user->isAdmin();
    }
}