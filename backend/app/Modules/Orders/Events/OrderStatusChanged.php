<?php

namespace App\Modules\Orders\Events;

final class OrderStatusChanged
{
    public function __construct(
        public readonly int $orderId,
        public readonly int $userId,
        public readonly string $from,
        public readonly string $to,
    ) {}
}