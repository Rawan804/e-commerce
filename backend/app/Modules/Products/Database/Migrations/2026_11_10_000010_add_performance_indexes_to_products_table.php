<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * فهارس مبنية على الاستعلامات الفعلية بـ ProductController::index:
 *   WHERE category = ? ORDER BY created_at DESC, id DESC LIMIT 15   -> (category, created_at)
 *   ORDER BY created_at / price / name  (بدون تصنيف)                  -> فهرس لكل عمود ترتيب
 * InnoDB بيضيف الـ id تلقائياً لآخر كل فهرس ثانوي، فالفهرس بيخدم الترتيب كله بدون filesort.
 *
 * فهرس category القديم صار زيادة (أول عمود بالفهرس المركّب بيغطيه)، فبنحذفه:
 * كل فهرس زيادة بيبطّئ كل INSERT/UPDATE ويستهلك مساحة.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['category']);

            $table->index(['category', 'created_at'], 'products_category_created_idx');
            $table->index('created_at', 'products_created_idx');
            $table->index('price', 'products_price_idx');
            $table->index('name', 'products_name_idx');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_category_created_idx');
            $table->dropIndex('products_created_idx');
            $table->dropIndex('products_price_idx');
            $table->dropIndex('products_name_idx');

            $table->index('category');
        });
    }
};
