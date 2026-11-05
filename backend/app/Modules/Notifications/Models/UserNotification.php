<?php

namespace App\Modules\Notifications\Models;

use Illuminate\Database\Eloquent\Model;

class UserNotification extends Model
{
    // اسم الجدول مخصص حتى ما يتعارض مع جدول notifications الافتراضي بـ Laravel
    protected $table = 'user_notifications';

    protected $fillable = ['user_id', 'type', 'message', 'data', 'read_at'];

    protected function casts(): array
    {
        return ['data' => 'array', 'read_at' => 'datetime'];
    }
}