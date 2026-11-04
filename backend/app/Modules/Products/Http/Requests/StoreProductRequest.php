<?php

namespace App\Modules\Products\Http\Requests;

use App\Modules\Products\Models\Product;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Product::class);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:5000'],
            'price' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'category' => ['required', 'string', 'max:100'],
            'image' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ];
    }
}