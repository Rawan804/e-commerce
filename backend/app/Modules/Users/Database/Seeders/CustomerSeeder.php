<?php

namespace App\Modules\Users\Database\Seeders;

use App\Modules\Users\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Seeds demo customer accounts.
 * Safe to run multiple times — uses firstOrNew on email.
 */
class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $customers = [
            ['name' => 'Alice Johnson', 'email' => 'alice@example.com'],
            ['name' => 'Bob Williams',  'email' => 'bob@example.com'],
            ['name' => 'Carol Davis',   'email' => 'carol@example.com'],
        ];

        foreach ($customers as $data) {
            $user = User::firstOrNew(['email' => $data['email']]);
            if (! $user->exists) {
                $user->name     = $data['name'];
                $user->password = Hash::make('Customer#12345');
                $user->role     = User::ROLE_CUSTOMER;
                $user->save();
            }
        }
    }
}
