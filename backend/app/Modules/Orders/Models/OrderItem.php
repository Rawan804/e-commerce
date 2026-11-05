<?php

namespace App\Modules\Orders\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    protected $fillable = ['order_id', 'product_id', 'product_name', 'unit_price', 'quantity'];

    protected function casts(): array
    {
        return ['unit_price' => 'decimal:2'];
    }
}