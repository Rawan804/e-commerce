<?php

namespace App\Modules\Notifications\Http\Controllers;

use App\Modules\Notifications\Http\Resources\NotificationResource;
use App\Modules\Notifications\Models\UserNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class NotificationController
{
    public function index(Request $request)
    {
        $request->validate([
            'unread' => ['sometimes', 'boolean'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $items = UserNotification::query()
            ->where('user_id', $request->user()->id) // دايماً مقيّد بصاحب التوكن
            ->when($request->boolean('unread'), fn ($q) => $q->whereNull('read_at'))
            ->latest('id')
            ->paginate((int) $request->input('per_page', 15))
            ->withQueryString();

        return NotificationResource::collection($items);
    }

    public function markAsRead(UserNotification $notification): NotificationResource
    {
        Gate::authorize('markAsRead', $notification);

        $notification->update(['read_at' => $notification->read_at ?? now()]);

        return new NotificationResource($notification);
    }
}