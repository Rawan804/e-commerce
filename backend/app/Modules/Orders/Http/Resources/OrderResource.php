<?php

namespace App\Modules\Orders\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'user_id'    => $this->user_id,
            'user_name'  => $this->whenLoaded('user', fn () => $this->user->name, null),
            'status'     => $this->status->value,
            'total'      => (string) $this->total,
            'items'      => $this->whenLoaded('items', fn () => $this->items->map(fn ($i) => [
                'product_id'   => $i->product_id,
                'product_name' => $i->product_name,
                'unit_price'   => (string) $i->unit_price,
                'quantity'     => $i->quantity,
                'subtotal'     => number_format((float) $i->unit_price * $i->quantity, 2, '.', ''),
            ])),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
