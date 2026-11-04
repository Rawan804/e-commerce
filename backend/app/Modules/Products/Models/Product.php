<?php

namespace App\Modules\Products\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;

class Product extends Model
{
    // image_path مو fillable: بيتحدد من كود رفع الصورة فقط، مش من مدخلات المستخدم
    protected $fillable = ['name', 'description', 'price', 'category'];

    protected function casts(): array
    {
        return ['price' => 'decimal:2'];
    }

    public function imageUrl(): ?string
    {
        if (! $this->image_path) {
            return null;
        }

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('public');

        return $disk->url($this->image_path);
    }
}