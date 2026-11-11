<?php

namespace Tests\Feature\Api;

use App\Services\WarehouseGrpcService;
use Mockery;
use Mockery\MockInterface;

class ProductStockResilienceTest extends ApiTestCase
{
    public function test_product_list_shows_stock_from_warehouse(): void
    {
        $warehouse = $this->warehouse();
        $warehouse->shouldReceive('getStock')->times(3)->andReturn(7);
        $this->makeProduct();
        $this->makeProduct();
        $this->makeProduct();

        $response = $this->getJson('/api/v1/products?per_page=3')->assertOk();

        foreach ($response->json('data') as $product) {
            $this->assertSame(7, $product['stock_quantity']);
        }
    }

    public function test_unavailable_warehouse_is_asked_only_once_per_list_request(): void
    {
        // once(): بعد أول فشل ما منسأل المستودع لباقي المنتجات (بدل ما ننتظر المهلة لكل منتج)
        $warehouse = $this->warehouse();
        $warehouse->shouldReceive('getStock')->once()->andThrow(new \RuntimeException('deadline exceeded'));
        $this->makeProduct();
        $this->makeProduct();
        $this->makeProduct();

        $response = $this->getJson('/api/v1/products?per_page=3')->assertOk();

        $this->assertCount(3, $response->json('data'));
        foreach ($response->json('data') as $product) {
            $this->assertNull($product['stock_quantity']);
        }
    }

    public function test_product_details_still_works_when_warehouse_is_unavailable(): void
    {
        $warehouse = $this->warehouse();
        $warehouse->shouldReceive('getStock')->once()->andThrow(new \RuntimeException('unavailable'));
        $product = $this->makeProduct();

        $this->getJson("/api/v1/products/{$product->id}")
            ->assertOk()
            ->assertJsonPath('data.stock_quantity', null);
    }

    private function warehouse(): MockInterface&WarehouseGrpcService
    {
        $warehouse = Mockery::mock(WarehouseGrpcService::class);
        $this->app->instance(WarehouseGrpcService::class, $warehouse);

        return $warehouse;
    }
}