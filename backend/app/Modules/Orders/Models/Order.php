<?php

namespace App\Modules\Orders\Models;

use App\Modules\Orders\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = ['user_id', 'status', 'total'];

    protected function casts(): array
    {
        return ['status' => OrderStatus::class, 'total' => 'decimal:2'];
    }

    /** @return HasMany<OrderItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class, 'order_id');
    }
}