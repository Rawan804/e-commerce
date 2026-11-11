<?php

namespace Tests\Feature\Api;

use App\Modules\Orders\Enums\OrderStatus;
use App\Modules\Orders\Jobs\ReleaseReservationStock;
use App\Modules\Orders\Models\Order;
use App\Modules\Orders\Models\StockReleaseRequest;
use App\Services\WarehouseGrpcService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Mockery;
use Mockery\MockInterface;

class OrderReliabilityTest extends ApiTestCase
{
    public function test_successful_order_creation_persists_reservation_and_notification(): void
    {
        $warehouse = $this->successfulWarehouse();
        $this->app->instance(WarehouseGrpcService::class, $warehouse);
        $customer = $this->makeUser();
        $product = $this->makeProduct(['price' => '12.00']);

        $response = $this->callAs($customer, 'POST', '/api/v1/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
        ]);

        $response->assertCreated();

        $order = Order::query()->firstOrFail();

        $this->assertNotEmpty($order->reservation_id);
        $this->assertCount(1, $order->items);

        $this->assertDatabaseHas('user_notifications', [
            'user_id' => $customer->id,
            'type' => 'order.placed',
        ]);
    }

    public function test_persistence_failure_creates_compensation_and_releases_stock(): void
    {
        $warehouse = $this->successfulWarehouse();
        $this->app->instance(WarehouseGrpcService::class, $warehouse);

        DB::statement("
            CREATE TRIGGER fail_orders_insert
            BEFORE INSERT ON orders
            BEGIN
                SELECT RAISE(ABORT, 'forced failure');
            END
        ");

        $customer = $this->makeUser();
        $product = $this->makeProduct();

        $this->callAs($customer, 'POST', '/api/v1/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertStatus(500)
            ->assertJsonPath('error.code', 'ORDER_CREATION_FAILED');

        $this->assertDatabaseHas('stock_release_requests', [
            'reason' => 'persistence_failed',
            'status' => StockReleaseRequest::STATUS_RELEASED,
        ]);
    }

    public function test_compensation_failure_remains_retryable_and_is_not_confirmed(): void
    {
        $warehouse = Mockery::mock(WarehouseGrpcService::class);

        $warehouse->shouldReceive('reserveStock')->andReturn(true);
        $warehouse->shouldReceive('releaseStock')
            ->andThrow(new \RuntimeException('warehouse down'));

        $this->app->instance(WarehouseGrpcService::class, $warehouse);

        // phpunit.xml يضبط QUEUE_CONNECTION=sync، وهذا ينفّذ إعادة المحاولة فوراً ولا يكتبها في جدول jobs.
        // هنا نستعمل database queue كما في التشغيل الحقيقي. أما dispatchSync فيبقى ينفّذ فوراً
        // لأنه يمر على اتصال 'sync' صراحةً. ولا نستعمل Queue::fake() لأنه يعترض dispatchSync أيضاً.
        config(['queue.default' => 'database']);

        DB::statement("
            CREATE TRIGGER fail_orders_insert
            BEFORE INSERT ON orders
            BEGIN
                SELECT RAISE(ABORT, 'forced failure');
            END
        ");

        $customer = $this->makeUser();
        $product = $this->makeProduct();

        $this->callAs($customer, 'POST', '/api/v1/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertStatus(500);

        $release = StockReleaseRequest::query()->firstOrFail();

        $this->assertSame(
            StockReleaseRequest::STATUS_FAILED,
            $release->status
        );

        $this->assertNotNull($release->last_error);
        $this->assertNull($release->released_at);

        // التأكد من جدولة Job لإعادة محاولة إرجاع المخزون.
        $this->assertTrue(
            DB::table('jobs')
                ->where('payload', 'like', '%ReleaseReservationStock%')
                ->exists(),
            'The stock release retry should be queued.'
        );
    }

    public function test_cancellation_releases_stock_and_changes_status(): void
    {
        $warehouse = $this->successfulWarehouse();
        $this->app->instance(WarehouseGrpcService::class, $warehouse);

        $customer = $this->makeUser();
        $product = $this->makeProduct();
        $orderId = $this->placeOrder($customer, $product);

        $this->callAs($this->makeUser('admin'), 'PATCH', "/api/v1/orders/{$orderId}/status", [
            'status' => 'cancelled',
        ])->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $this->assertSame(
            OrderStatus::Cancelled,
            Order::findOrFail($orderId)->status
        );

        $this->assertDatabaseHas('stock_release_requests', [
            'order_id' => $orderId,
            'status' => StockReleaseRequest::STATUS_RELEASED,
        ]);

        $this->assertDatabaseHas('user_notifications', [
            'user_id' => $customer->id,
            'type' => 'order.status_changed',
        ]);
    }

    public function test_warehouse_unavailability_returns_clear_service_error(): void
    {
        $warehouse = Mockery::mock(WarehouseGrpcService::class);

        $warehouse->shouldReceive('reserveStock')
            ->andThrow(new \RuntimeException('deadline exceeded'));

        $this->app->instance(WarehouseGrpcService::class, $warehouse);

        Queue::fake();

        $customer = $this->makeUser();
        $product = $this->makeProduct();

        $this->callAs($customer, 'POST', '/api/v1/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertStatus(503)
            ->assertJsonPath('error.code', 'WAREHOUSE_UNAVAILABLE');

        $this->assertDatabaseCount('orders', 0);

        // نتيجة الحجز مجهولة، لذلك يجب جدولة محاولة إرجاع لنفس reservation_id.
        $this->assertDatabaseHas('stock_release_requests', [
            'reason' => 'reserve_uncertain',
        ]);

        Queue::assertPushed(ReleaseReservationStock::class, 1);
    }

    public function test_uncertain_reservation_release_with_nothing_to_release_counts_as_success(): void
    {
        $warehouse = Mockery::mock(WarehouseGrpcService::class);

        $warehouse->shouldReceive('releaseStock')
            ->once()
            ->andReturn(false);

        $this->app->instance(WarehouseGrpcService::class, $warehouse);

        $release = StockReleaseRequest::create([
            'reservation_id' => 'never-reserved',
            'reason' => 'reserve_uncertain',
            'status' => StockReleaseRequest::STATUS_PENDING,
        ]);

        (new ReleaseReservationStock($release->id))->handle($warehouse);

        $this->assertSame(
            StockReleaseRequest::STATUS_RELEASED,
            $release->fresh()->status
        );
    }

    public function test_duplicate_release_job_is_idempotent(): void
    {
        $warehouse = $this->successfulWarehouse();

        $warehouse->shouldReceive('releaseStock')
            ->once()
            ->andReturn(true);

        $this->app->instance(WarehouseGrpcService::class, $warehouse);

        $release = StockReleaseRequest::create([
            'reservation_id' => 'duplicate-reservation',
            'reason' => 'test',
            'status' => StockReleaseRequest::STATUS_PENDING,
        ]);

        (new ReleaseReservationStock($release->id))->handle($warehouse);
        (new ReleaseReservationStock($release->id))->handle($warehouse);

        $this->assertSame(
            StockReleaseRequest::STATUS_RELEASED,
            $release->fresh()->status
        );
    }

    private function successfulWarehouse(): MockInterface&WarehouseGrpcService
    {
        $warehouse = Mockery::mock(WarehouseGrpcService::class);

        $warehouse->shouldReceive('reserveStock')
            ->andReturnUsing(function ($items, $reservationId, &$shortages) {
                return true;
            });

        $warehouse->shouldReceive('releaseStock')
            ->andReturn(true)
            ->byDefault();

        return $warehouse;
    }
}