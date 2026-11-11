<?php

namespace Tests\Feature\Api;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

class ProductStockAdminTest extends ApiTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.warehouse.admin_url' => 'http://warehouse-admin.test',
            'services.warehouse.admin_key' => 'test-key',
        ]);
    }

    public function test_admin_sets_stock_through_the_warehouse_admin_api(): void
    {
        Http::fake(['warehouse-admin.test/*' => Http::response(['available' => 25], 200)]);
        $product = $this->makeProduct();

        $this->callAs($this->makeUser('admin'), 'PUT', "/api/v1/products/{$product->id}/stock", ['quantity' => 25])
            ->assertOk()
            ->assertJsonPath('data.product_id', $product->id)
            ->assertJsonPath('data.stock_quantity', 25);

        Http::assertSent(fn (Request $r) => $r->method() === 'PUT'
            && $r->url() === "http://warehouse-admin.test/stock/{$product->id}"
            && $r->header('X-Admin-Key') === ['test-key']
            && $r->data()['quantity'] === 25);
    }

    public function test_customer_cannot_set_stock(): void
    {
        Http::fake();
        $product = $this->makeProduct();

        $this->callAs($this->makeUser('customer'), 'PUT', "/api/v1/products/{$product->id}/stock", ['quantity' => 5])
            ->assertForbidden();

        Http::assertNothingSent();
    }

    public function test_anonymous_request_gets_401(): void
    {
        Http::fake();
        $product = $this->makeProduct();

        $this->callAs(null, 'PUT', "/api/v1/products/{$product->id}/stock", ['quantity' => 5])
            ->assertUnauthorized();

        Http::assertNothingSent();
    }

    public function test_invalid_quantity_is_rejected_before_reaching_the_warehouse(): void
    {
        Http::fake();
        $admin = $this->makeUser('admin');
        $product = $this->makeProduct();

        foreach ([-1, 'abc', 100001, null] as $bad) {
            $this->callAs($admin, 'PUT', "/api/v1/products/{$product->id}/stock", ['quantity' => $bad])
                ->assertStatus(422)
                ->assertJsonPath('error.code', 'VALIDATION_ERROR');
        }

        Http::assertNothingSent();
    }

    public function test_unknown_product_returns_404(): void
    {
        Http::fake();

        $this->callAs($this->makeUser('admin'), 'PUT', '/api/v1/products/999999/stock', ['quantity' => 5])
            ->assertNotFound();

        Http::assertNothingSent();
    }

    public function test_warehouse_down_returns_clear_503(): void
    {
        Http::fake(['*' => fn () => throw new ConnectionException('connection refused')]);
        $product = $this->makeProduct();

        $this->callAs($this->makeUser('admin'), 'PUT', "/api/v1/products/{$product->id}/stock", ['quantity' => 5])
            ->assertStatus(503)
            ->assertJsonPath('error.code', 'WAREHOUSE_UNAVAILABLE');
    }

    public function test_warehouse_rejecting_the_key_is_reported_as_503_not_success(): void
    {
        Http::fake(['*' => Http::response(['error' => 'forbidden'], 403)]);
        $product = $this->makeProduct();

        $this->callAs($this->makeUser('admin'), 'PUT', "/api/v1/products/{$product->id}/stock", ['quantity' => 5])
            ->assertStatus(503)
            ->assertJsonPath('error.code', 'WAREHOUSE_UNAVAILABLE');
    }
}
