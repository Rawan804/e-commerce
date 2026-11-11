<?php

namespace Tests\Feature\Api;

use App\Modules\Products\Models\Product;
use App\Modules\Users\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;
use App\Services\WarehouseGrpcService;

abstract class ApiTestCase extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $warehouse = \Mockery::mock(WarehouseGrpcService::class);
        $warehouse->shouldReceive('reserveStock')->andReturnUsing(function ($items, $reservationId, &$shortages) {
            return true;
        });
        $warehouse->shouldReceive('releaseStock')->andReturn(true)->byDefault();
        $this->app->instance(WarehouseGrpcService::class, $warehouse);
    }

    protected function makeUser(string $role = 'customer'): User
    {
        $user = User::create([
            'name' => 'Test '.$role,
            'email' => Str::lower(Str::random(8)).'@example.com',
            'password' => 'Password123',
        ]);
        $user->forceFill(['role' => $role])->save(); // role مو fillable، فبنعيّنه مباشرة

        return $user->refresh();
    }

    protected function makeProduct(array $attrs = []): Product
    {
        return Product::create($attrs + [
            'name' => 'Item '.Str::random(4),
            'price' => '10.50',
            'category' => 'general',
        ]);
    }

    /** بيرسل طلب JSON كأنو $user (null يعني بدون تسجيل دخول) */
    protected function callAs(?User $user, string $method, string $uri, array $data = []): TestResponse
    {
        // حارس جديد لكل طلب، حتى ما يضل المستخدم السابق مخزّن
        $this->app['auth']->forgetGuards();

        if ($user) {
            $this->actingAs($user, 'api');
        }

        return $this->json($method, $uri, $data);
    }

    protected function placeOrder(User $customer, ?Product $product = null, int $qty = 2): int
    {
        $product ??= $this->makeProduct();

        $warehouse = \Mockery::mock(WarehouseGrpcService::class);
        $warehouse->shouldReceive('reserveStock')->andReturnUsing(function ($items, $reservationId, &$shortages) {
            return true;
        });
        $warehouse->shouldReceive('releaseStock')->andReturn(true)->byDefault();
        $this->app->instance(WarehouseGrpcService::class, $warehouse);

        return $this->callAs($customer, 'POST', '/api/v1/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => $qty]],
        ])->assertCreated()->json('data.id');
    }
}