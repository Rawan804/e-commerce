<?php

namespace App\Modules\Products\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'price' => (string) $this->price,
            'category' => $this->category,
            'image_url' => $this->imageUrl(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}