<?php

namespace Database\Seeders;

use App\Modules\Products\Database\Seeders\ProductSeeder;
use App\Modules\Users\Database\Seeders\AdminSeeder;
use App\Modules\Users\Database\Seeders\CustomerSeeder;
use Illuminate\Database\Seeder;

/**
 * Master seeder — safe to run repeatedly.
 * Order matters: Admin first, then customers, then products.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            AdminSeeder::class,
            CustomerSeeder::class,
            ProductSeeder::class,
        ]);
    }
}
