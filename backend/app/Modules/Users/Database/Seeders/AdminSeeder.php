<?php

namespace App\Modules\Users\Database\Seeders;

use App\Modules\Users\Models\User;
use Illuminate\Database\Seeder;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrNew(['email' => env('ADMIN_EMAIL', 'admin@example.com')]);
        $admin->name = 'Administrator';
        $admin->password = env('ADMIN_PASSWORD', 'Admin#12345');
        $admin->role = User::ROLE_ADMIN; // بالإسناد المباشر، لأنو role مو fillable
        $admin->save();
    }
}