<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('orders', 'reservation_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->string('reservation_id', 64)->nullable()->after('status')->index();
            });
        }

        if (! Schema::hasTable('stock_release_requests')) {
            Schema::create('stock_release_requests', function (Blueprint $table) {
                $table->id();
                $table->string('reservation_id', 64)->unique();
                $table->unsignedBigInteger('order_id')->nullable()->index();
                $table->string('reason', 32);
                $table->string('status', 16)->default('pending')->index();
                $table->unsignedInteger('attempts')->default(0);
                $table->text('last_error')->nullable();
                $table->timestamp('released_at')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_release_requests');

        if (Schema::hasColumn('orders', 'reservation_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropIndex(['reservation_id']);
                $table->dropColumn('reservation_id');
            });
        }
    }
};
