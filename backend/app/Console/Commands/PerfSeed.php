<?php

namespace App\Console\Commands;

use App\Modules\Products\Services\ProductCache;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * يعبّي قاعدة البيانات ببيانات وهمية بحجم حقيقي حتى يظهر البطء فعلاً.
 *
 *   php artisan perf:seed                       (2000 مستخدم، 20000 منتج، 300000 طلب)
 *   php artisan perf:seed --orders=500000
 *   php artisan perf:seed --clean               (يحذف بيانات perf فقط)
 *
 * المستخدمين: perf1@example.com ... بكلمة السر  Password123
 */
class PerfSeed extends Command
{
    protected $signature = 'perf:seed
        {--users=2000}
        {--products=20000}
        {--orders=300000}
        {--chunk=2000}
        {--clean : احذف بيانات perf فقط}';

    protected $description = 'Seed large fake dataset (users, products, orders) for performance testing';

    private const CATEGORIES = [
        'Audio', 'Computing', 'Wearables', 'Photography', 'Stationery', 'Home & Kitchen',
        'Gaming', 'Sports', 'Books', 'Toys', 'Garden', 'Tools', 'Beauty', 'Health',
        'Pets', 'Office', 'Travel', 'Fashion', 'Music', 'Phones',
    ];

    private const STATUSES = [
        'pending', 'confirmed', 'shipped', 'delivered', 'delivered', 'delivered', 'cancelled',
    ];

    public function handle(): int
    {
        if (DB::getDriverName() !== 'mysql') {
            $this->warn('الأمر مخصص لـ MySQL (بيانات ضخمة).');
        }

        // كل شي هون من الأساسية (مو من نسخة القراءة)
        DB::connection()->useWriteConnectionWhenReading();

        if ($this->option('clean')) {
            return $this->clean();
        }

        $chunk = max(100, (int) $this->option('chunk'));

        $this->seedUsers((int) $this->option('users'), $chunk);
        $this->seedProducts((int) $this->option('products'), $chunk);
        $this->seedOrders((int) $this->option('orders'), $chunk);

        app(ProductCache::class)->flush();

        $this->info('Done.');
        $this->line('Customer login: perf1@example.com / Password123');
        $this->line('Product ids: '.DB::table('products')->min('id').' .. '.DB::table('products')->max('id'));

        return self::SUCCESS;
    }

    private function seedUsers(int $count, int $chunk): void
    {
        $this->info("Users: {$count}");
        $password = Hash::make('Password123'); // مرة وحدة: bcrypt بطيء
        $now = now()->toDateTimeString();

        for ($i = 1; $i <= $count; $i += $chunk) {
            $rows = [];
            for ($n = $i; $n < $i + $chunk && $n <= $count; $n++) {
                $rows[] = [
                    'name' => "Perf User {$n}",
                    'email' => "perf{$n}@example.com",
                    'password' => $password,
                    'role' => 'customer',
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
            DB::table('users')->insertOrIgnore($rows);
        }
    }

    private function seedProducts(int $count, int $chunk): void
    {
        $this->info("Products: {$count}");
        $bar = $this->output->createProgressBar($count);
        $cats = count(self::CATEGORIES);

        for ($i = 1; $i <= $count; $i += $chunk) {
            $rows = [];
            for ($n = $i; $n < $i + $chunk && $n <= $count; $n++) {
                $ts = now()->subSeconds(random_int(0, 365 * 86400))->toDateTimeString();
                $rows[] = [
                    'name' => "Perf Product {$n}",
                    'description' => 'Generated product for load testing. '.str_repeat('Lorem ipsum ', 5),
                    'price' => random_int(100, 200000) / 100,
                    'category' => self::CATEGORIES[$n % $cats],
                    'image_path' => null,
                    'created_at' => $ts,
                    'updated_at' => $ts,
                ];
            }
            DB::table('products')->insert($rows);
            $bar->advance(count($rows));
        }
        $bar->finish();
        $this->newLine();
    }

    private function seedOrders(int $count, int $chunk): void
    {
        $this->info("Orders: {$count} (+ items)");

        $userIds = DB::table('users')->where('email', 'like', 'perf%@example.com')->pluck('id')->all();
        $products = DB::table('products')->where('name', 'like', 'Perf Product %')
            ->limit(5000)->get(['id', 'name', 'price'])->all();

        if (! $userIds || ! $products) {
            $this->error('لازم يكون في مستخدمين ومنتجات perf أولاً.');

            return;
        }

        $bar = $this->output->createProgressBar($count);
        $pdo = DB::getPdo();

        for ($i = 1; $i <= $count; $i += $chunk) {
            $orders = [];
            $itemsPerOrder = [];

            for ($n = $i; $n < $i + $chunk && $n <= $count; $n++) {
                $ts = now()->subSeconds(random_int(0, 365 * 86400))->toDateTimeString();
                $lines = [];
                $total = 0;

                for ($k = random_int(1, 4); $k > 0; $k--) {
                    $p = $products[array_rand($products)];
                    $qty = random_int(1, 5);
                    $lines[] = [$p, $qty];
                    $total += (float) $p->price * $qty;
                }

                $orders[] = [
                    'user_id' => $userIds[array_rand($userIds)],
                    'status' => self::STATUSES[array_rand(self::STATUSES)],
                    'total' => round($total, 2),
                    'created_at' => $ts,
                    'updated_at' => $ts,
                ];
                $itemsPerOrder[] = [$lines, $ts];
            }

            DB::transaction(function () use ($orders, $itemsPerOrder, $pdo) {
                DB::table('orders')->insert($orders);

                // MySQL: lastInsertId بعد INSERT متعدد = أول id بالدفعة، والباقي متتابع
                $firstId = (int) $pdo->lastInsertId();
                $items = [];

                foreach ($itemsPerOrder as $idx => [$lines, $ts]) {
                    foreach ($lines as [$p, $qty]) {
                        $items[] = [
                            'order_id' => $firstId + $idx,
                            'product_id' => $p->id,
                            'product_name' => $p->name,
                            'unit_price' => $p->price,
                            'quantity' => $qty,
                            'created_at' => $ts,
                            'updated_at' => $ts,
                        ];
                    }
                }

                foreach (array_chunk($items, 2000) as $part) {
                    DB::table('order_items')->insert($part);
                }
            });

            $bar->advance(count($orders));
        }

        $bar->finish();
        $this->newLine();
    }

    private function clean(): int
    {
        $ids = DB::table('users')->where('email', 'like', 'perf%@example.com')->pluck('id');

        foreach ($ids->chunk(500) as $part) {
            DB::table('orders')->whereIn('user_id', $part)->delete(); // order_items بتنحذف بالـ cascade
        }

        DB::table('users')->where('email', 'like', 'perf%@example.com')->delete();
        DB::table('products')->where('name', 'like', 'Perf Product %')->delete();

        app(ProductCache::class)->flush();
        $this->info('perf data removed.');

        return self::SUCCESS;
    }
}
