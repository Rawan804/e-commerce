<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * NotificationController::index:
 *   WHERE user_id = ? [AND read_at IS NULL] ORDER BY id DESC
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_notifications', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
            $table->index(['user_id', 'read_at'], 'user_notifications_user_read_idx');
        });
    }

    public function down(): void
    {
        Schema::table('user_notifications', function (Blueprint $table) {
            $table->dropIndex('user_notifications_user_read_idx');
            $table->index('user_id');
        });
    }
};
