<?php

namespace App\Console\Commands;

use App\Modules\Orders\Models\Order;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * يعرض EXPLAIN + متوسط زمن التنفيذ لأهم استعلامات المشروع، ويعرض مشكلة N+1.
 * شغّله قبل وبعد migration الفهارس (php artisan migrate:rollback --step=3 / migrate) وقارن الأرقام.
 *
 *   php artisan perf:explain
 *   php artisan perf:explain --runs=50
 */
class PerfExplain extends Command
{
    protected $signature = 'perf:explain {--runs=20}';

    protected $description = 'EXPLAIN + timing of the main queries, and an N+1 demo';

    public function handle(): int
    {
        if (DB::getDriverName() !== 'mysql') {
            $this->error('EXPLAIN المفصّل مخصص لـ MySQL.');

            return self::FAILURE;
        }

        // القياس من الأساسية حتى تكون النتائج ثابتة
        DB::connection()->useWriteConnectionWhenReading();

        $runs = max(1, (int) $this->option('runs'));
        $userId = (int) (DB::table('users')->where('email', 'perf1@example.com')->value('id') ?? 1);
        $category = (string) (DB::table('products')->value('category') ?? 'Audio');

        $this->line('rows: orders='.DB::table('orders')->count().' products='.DB::table('products')->count());
        $this->newLine();

        $queries = [
            'products: category + newest' => [
                'select * from products where category = ? order by created_at desc, id desc limit 15', [$category],
            ],
            'products: sort by price' => [
                'select * from products order by price asc, id asc limit 15', [],
            ],
            'products: sort by name' => [
                'select * from products order by name asc, id asc limit 15', [],
            ],
            'orders: my orders (customer)' => [
                'select * from orders where user_id = ? order by id desc limit 15', [$userId],
            ],
            'orders: my orders by status' => [
                'select * from orders where user_id = ? and status = ? order by id desc limit 15', [$userId, 'delivered'],
            ],
            'orders: admin by status' => [
                'select * from orders where status = ? order by id desc limit 15', ['pending'],
            ],
            'orders: admin COUNT(*) for pagination' => [
                'select count(*) as c from orders where status = ?', ['pending'],
            ],
            'notifications: my unread' => [
                'select * from user_notifications where user_id = ? and read_at is null order by id desc limit 15', [$userId],
            ],
        ];

        $rows = [];
        foreach ($queries as $label => [$sql, $bindings]) {
            $plan = DB::select('EXPLAIN '.$sql, $bindings)[0];
            $start = microtime(true);
            for ($i = 0; $i < $runs; $i++) {
                DB::select($sql, $bindings);
            }
            $ms = (microtime(true) - $start) * 1000 / $runs;

            $rows[] = [
                $label,
                $plan->type ?? '',
                $plan->key ?? 'NULL',
                $plan->rows ?? '',
                $plan->Extra ?? '',
                number_format($ms, 2),
            ];
        }

        $this->table(['query', 'type', 'key', 'rows scanned', 'Extra', 'avg ms'], $rows);
        $this->line('Extra فيها "Using filesort" = ترتيب بالذاكرة (بطيء)، و type=ALL = مسح كامل للجدول.');
        $this->newLine();

        $this->nPlusOneDemo();

        return self::SUCCESS;
    }

    private function nPlusOneDemo(): void
    {
        $count = function (callable $fn): int {
            $n = 0;
            DB::listen(function () use (&$n) { $n++; });
            $fn();

            return $n;
        };

        $naive = $count(function () {
            foreach (Order::query()->latest('id')->limit(15)->get() as $order) {
                $order->items->count(); // استعلام لكل طلب = N+1
            }
        });

        $eager = $count(function () {
            Order::query()->with('items')->latest('id')->limit(15)->get();
        });

        $this->info('N+1 على الطلبات (15 طلب):');
        $this->line("  بدون with(): {$naive} استعلام  |  مع with('items'): {$eager} استعلام");
        $this->line('  الكود الحالي (OrderController) أصلاً بيستخدم with(): مافي N+1 بقاعدة البيانات.');
        $this->line('  الـ N+1 الفعلي بالمشروع كان بـ ProductResource: مناداة gRPC للمستودع لكل منتج بالقائمة؛');
        $this->line('  الكاش بيلغيها (قائمة 15 منتج = 15 مناداة قبل، 0 مناداة عند Cache HIT).');
    }
}
