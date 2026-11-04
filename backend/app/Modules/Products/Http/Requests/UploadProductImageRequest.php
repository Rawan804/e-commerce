<?php

namespace App\Modules\Products\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadProductImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('product'));
    }

    public function rules(): array
    {
        return ['image' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048']];
    }
}