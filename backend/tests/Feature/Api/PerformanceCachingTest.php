<?php

namespace Tests\Feature\Api;

use App\Services\WarehouseGrpcService;
use Illuminate\Support\Facades\Cache;
use Mockery;
use Mockery\MockInterface;

/**
 * إثبات المتطلب الثالث: التخزين المؤقت شغّال، وتعديل المنتج بيظهر فوراً رغم الكاش.
 */
class PerformanceCachingTest extends ApiTestCase
{
    private function warehouse(): MockInterface&WarehouseGrpcService
    {
        $warehouse = Mockery::mock(WarehouseGrpcService::class);
        $this->app->instance(WarehouseGrpcService::class, $warehouse);

        return $warehouse;
    }

    // ---------------------------------------------------------------- HTTP (ETag)

    public function test_product_response_has_etag_and_returns_304_when_unchanged(): void
    {
        $this->warehouse()->shouldReceive('getStock')->andReturn(5);
        $product = $this->makeProduct();

        $first = $this->getJson("/api/v1/products/{$product->id}")->assertOk();
        $etag = $first->headers->get('ETag');

        $this->assertNotEmpty($etag);
        $this->assertStringContainsString('public', $first->headers->get('Cache-Control'));

        $second = $this->withHeaders(['If-None-Match' => $etag])->getJson("/api/v1/products/{$product->id}");

        $second->assertStatus(304);
        $this->assertSame('', $second->getContent());
    }

    public function test_responses_that_are_not_cacheable_stay_no_store(): void
    {
        $response = $this->callAs($this->makeUser(), 'GET', '/api/v1/orders')->assertOk();

        $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
    }

    // ---------------------------------------------------------------- Server cache

    public function test_second_identical_list_request_is_served_from_cache(): void
    {
        // 2 منتجات = 2 مناداة gRPC بالطلب الأول، و0 بالثاني (Cache HIT)
        $this->warehouse()->shouldReceive('getStock')->times(2)->andReturn(7);
        $this->makeProduct();
        $this->makeProduct();

        $a = $this->getJson('/api/v1/products?per_page=2')->assertOk()->getContent();
        $b = $this->getJson('/api/v1/products?per_page=2')->assertOk()->getContent();

        $this->assertSame($a, $b);
    }

    public function test_search_queries_are_not_cached(): void
    {
        $this->warehouse()->shouldReceive('getStock')->times(2)->andReturn(1);
        $this->makeProduct(['name' => 'Blue Lamp']);

        $this->getJson('/api/v1/products?q=Blue')->assertOk();
        $this->getJson('/api/v1/products?q=Blue')->assertOk();
    }

    public function test_response_with_warehouse_down_is_not_cached(): void
    {
        $warehouse = $this->warehouse();
        $product = $this->makeProduct();

        // الأولى: المستودع واقف -> stock null، ولا يُخزَّن
        $warehouse->shouldReceive('getStock')->once()->andThrow(new \RuntimeException('down'));
        $this->getJson("/api/v1/products/{$product->id}")->assertOk()->assertJsonPath('data.stock_quantity', null);

        // الثانية: المستودع رجع -> لازم نشوف الكمية الحقيقية (مو null من الكاش)
        $warehouse->shouldReceive('getStock')->once()->andReturn(9);
        $this->getJson("/api/v1/products/{$product->id}")->assertOk()->assertJsonPath('data.stock_quantity', 9);
    }

    // ---------------------------------------------------------------- الإثبات المطلوب بالشريحة 11

    public function test_edited_product_is_visible_immediately_despite_caches(): void
    {
        $this->warehouse()->shouldReceive('getStock')->andReturn(3);
        $product = $this->makeProduct(['name' => 'Old Name', 'price' => '10.00']);
        $admin = $this->makeUser('admin');

        // 1) نقرأ مرتين: الثانية من الكاش، ونمسك البصمة القديمة
        $this->getJson("/api/v1/products/{$product->id}")->assertJsonPath('data.name', 'Old Name');
        $old = $this->getJson("/api/v1/products/{$product->id}");
        $old->assertJsonPath('data.name', 'Old Name');
        $oldEtag = $old->headers->get('ETag');

        // 2) الأدمن بيعدّل
        $this->callAs($admin, 'PUT', "/api/v1/products/{$product->id}", ['name' => 'New Name', 'price' => 12.5])
            ->assertOk();

        // 3) أول قراءة بعد التعديل: الاسم الجديد فوراً (الكاش انحذف)
        $this->app['auth']->forgetGuards();
        $fresh = $this->getJson("/api/v1/products/{$product->id}");
        $fresh->assertOk()->assertJsonPath('data.name', 'New Name');

        // 4) والمتصفح اللي معه البصمة القديمة ما بياخد 304: بياخد 200 ببيانات جديدة
        $this->withHeaders(['If-None-Match' => $oldEtag])
            ->getJson("/api/v1/products/{$product->id}")
            ->assertOk()
            ->assertJsonPath('data.name', 'New Name');

        $this->assertNotSame($oldEtag, $fresh->headers->get('ETag'));
    }

    public function test_new_product_appears_in_cached_list_and_deleted_one_disappears(): void
    {
        $this->warehouse()->shouldReceive('getStock')->andReturn(1);
        $admin = $this->makeUser('admin');
        $this->makeProduct(['name' => 'First']);

        $this->getJson('/api/v1/products')->assertJsonCount(1, 'data'); // نخزّن القائمة

        $created = $this->callAs($admin, 'POST', '/api/v1/products', [
            'name' => 'Second', 'price' => 5, 'category' => 'general',
        ])->assertCreated()->json('data.id');

        $this->getJson('/api/v1/products')->assertJsonCount(2, 'data');

        $this->callAs($admin, 'DELETE', "/api/v1/products/{$created}")->assertNoContent();

        $this->getJson('/api/v1/products')->assertJsonCount(1, 'data');
    }

    public function test_unknown_product_is_404(): void
    {
        $this->getJson('/api/v1/products/999999')->assertNotFound();
    }

    // ---------------------------------------------------------------- Read replica

    public function test_successful_write_pins_following_reads_to_primary(): void
    {
        config(['performance.replica.enabled' => true, 'performance.replica.pin_seconds' => 5]);

        $this->assertFalse(Cache::has('ryw:127.0.0.1'));

        $this->postJson('/api/v1/auth/register', [
            'name' => 'Sara', 'email' => 'sara.pin@example.com', 'password' => 'Password123',
        ])->assertCreated();

        $this->assertTrue(Cache::has('ryw:127.0.0.1'));
    }
}
