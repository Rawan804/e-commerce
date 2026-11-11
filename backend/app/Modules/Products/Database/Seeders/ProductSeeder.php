<?php

namespace App\Modules\Products\Database\Seeders;

use App\Modules\Products\Models\Product;
use Illuminate\Database\Seeder;

/**
 * Seeds 10 demo products.
 * Safe to run multiple times — uses updateOrCreate on name+category.
 * Product IDs 1-10 are kept stable so the Warehouse seed can reference them.
 */
class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            [
                'name'        => 'Wireless Noise-Cancelling Headphones',
                'description' => 'Premium over-ear headphones with active noise cancellation and 30-hour battery life.',
                'price'       => '149.99',
                'category'    => 'Audio',
            ],
            [
                'name'        => 'Mechanical Keyboard',
                'description' => 'Tenkeyless mechanical keyboard with Cherry MX switches and RGB backlighting.',
                'price'       => '89.99',
                'category'    => 'Computing',
            ],
            [
                'name'        => 'Smart Fitness Watch',
                'description' => 'Track heart rate, sleep, steps, and more with a 5-day battery.',
                'price'       => '199.99',
                'category'    => 'Wearables',
            ],
            [
                'name'        => 'Mirrorless Camera Kit',
                'description' => '24MP mirrorless camera with 18-55mm kit lens and in-body stabilisation.',
                'price'       => '799.99',
                'category'    => 'Photography',
            ],
            [
                'name'        => 'Bamboo Notebook Set',
                'description' => 'Eco-friendly set of 3 ruled notebooks with lay-flat binding.',
                'price'       => '14.99',
                'category'    => 'Stationery',
            ],
            [
                'name'        => 'Portable Bluetooth Speaker',
                'description' => 'Waterproof speaker with 360° sound and 12-hour playtime.',
                'price'       => '59.99',
                'category'    => 'Audio',
            ],
            [
                'name'        => 'USB-C Hub 7-in-1',
                'description' => 'Expands to HDMI, SD card, USB-A ×3, Ethernet, and 100W PD charging.',
                'price'       => '39.99',
                'category'    => 'Computing',
            ],
            [
                'name'        => 'Stainless Steel Desk Lamp',
                'description' => 'LED desk lamp with adjustable colour temperature and wireless charging base.',
                'price'       => '49.99',
                'category'    => 'Home & Kitchen',
            ],
            [
                'name'        => 'Ergonomic Lumbar Cushion',
                'description' => 'Memory-foam back support cushion for office chairs and car seats.',
                'price'       => '34.99',
                'category'    => 'Home & Kitchen',
            ],
            [
                'name'        => 'Fountain Pen Starter Set',
                'description' => 'Brass-tipped fountain pen with 6 ink cartridges and a leather case.',
                'price'       => '29.99',
                'category'    => 'Stationery',
            ],
        ];

        foreach ($products as $data) {
            Product::firstOrCreate(
                ['name' => $data['name'], 'category' => $data['category']],
                $data
            );
        }
    }
}
