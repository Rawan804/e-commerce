<?php

namespace App\Modules\Orders\Events;

/** حدث عام لوحدة الطلبات (الإشعارات رح تسمع له) */
final class OrderPlaced
{
    public function __construct(
        public readonly int $orderId,
        public readonly int $userId,
        public readonly string $total,
    ) {}
}