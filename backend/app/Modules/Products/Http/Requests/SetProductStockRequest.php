<?php

namespace App\Modules\Products\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SetProductStockRequest extends FormRequest
{
    public function authorize(): bool
    {
        // نفس صلاحية تعديل المنتج: أدمن فقط
        return $this->user()->can('update', $this->route('product'));
    }

    public function rules(): array
    {
        return [
            'quantity' => ['required', 'integer', 'min:0', 'max:100000'],
        ];
    }
}
