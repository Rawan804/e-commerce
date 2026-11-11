<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * OrderController::index:
 *   WHERE user_id = ? [AND status = ?] ORDER BY id DESC LIMIT 15
 * فهرس (user_id, status) بيخدم الحالتين (مع الحالة وبدونها) والترتيب بالـ id (مضاف تلقائياً بآخر الفهرس).
 * فهرس user_id لحاله صار زيادة فبنحذفه.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->index(['user_id', 'status'], 'orders_user_status_idx');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_user_status_idx');
            $table->index('user_id');
        });
    }
};
