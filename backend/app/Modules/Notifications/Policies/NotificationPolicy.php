<?php

namespace App\Modules\Notifications\Policies;

use App\Modules\Notifications\Models\UserNotification;
use App\Modules\Users\Models\User;

class NotificationPolicy
{
    /** المستخدم بيعلّم إشعاراته هو فقط كمقروءة */
    public function markAsRead(User $user, UserNotification $notification): bool
    {
        return (int) $notification->user_id === (int) $user->id;
    }
}