<?php

namespace App\Modules\Orders\Events;

/** حدث عام لوحدة الطلبات (الإشعارات رح تسمع له) */
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

final class OrderPlaced implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    public function __construct(
        public readonly int $orderId,
        public readonly int $userId,
        public readonly string $total,
    ) {}
}