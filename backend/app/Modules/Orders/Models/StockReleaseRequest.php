<?php

namespace App\Modules\Orders\Models;

use Illuminate\Database\Eloquent\Model;

class StockReleaseRequest extends Model
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_RELEASING = 'releasing';
    public const STATUS_RELEASED = 'released';
    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'reservation_id',
        'order_id',
        'reason',
        'status',
        'attempts',
        'last_error',
        'released_at',
    ];

    protected function casts(): array
    {
        return [
            'attempts' => 'integer',
            'released_at' => 'datetime',
        ];
    }
}
