<?php

namespace Tests\Feature\Api;

class OrderSecurityTest extends ApiTestCase
{
    public function test_customer_cannot_open_another_customers_order(): void
    {
        $alice = $this->makeUser();
        $bob = $this->makeUser();
        $orderId = $this->placeOrder($alice);

        $this->callAs($bob, 'GET', "/api/v1/orders/{$orderId}")
            ->assertForbidden()
            ->assertJsonPath('error.code', 'FORBIDDEN');

        $this->callAs($alice, 'GET', "/api/v1/orders/{$orderId}")->assertOk();
    }

    public function test_customer_cannot_change_order_status_even_on_own_order(): void
    {
        $alice = $this->makeUser();
        $orderId = $this->placeOrder($alice);

        $this->callAs($alice, 'PATCH', "/api/v1/orders/{$orderId}/status", ['status' => 'confirmed'])
            ->assertForbidden();

        // الحالة ما تغيّرت
        $this->callAs($alice, 'GET', "/api/v1/orders/{$orderId}")
            ->assertJsonPath('data.status', 'pending');
    }

    public function test_only_admin_can_change_status(): void
    {
        $orderId = $this->placeOrder($this->makeUser());

        $this->callAs($this->makeUser('admin'), 'PATCH', "/api/v1/orders/{$orderId}/status", ['status' => 'confirmed'])
            ->assertOk()
            ->assertJsonPath('data.status', 'confirmed');
    }

    public function test_invalid_status_transition_is_rejected(): void
    {
        $orderId = $this->placeOrder($this->makeUser());

        $this->callAs($this->makeUser('admin'), 'PATCH', "/api/v1/orders/{$orderId}/status", ['status' => 'delivered'])
            ->assertStatus(422)
            ->assertJsonPath('error.code', 'INVALID_STATUS_TRANSITION');
    }

    public function test_customer_lists_only_own_orders_and_admin_lists_all(): void
    {
        $alice = $this->makeUser();
        $bob = $this->makeUser();
        $this->placeOrder($alice);
        $this->placeOrder($alice);
        $this->placeOrder($bob);

        $this->callAs($alice, 'GET', '/api/v1/orders')->assertJsonPath('meta.total', 2);
        $this->callAs($bob, 'GET', '/api/v1/orders')->assertJsonPath('meta.total', 1);
        $this->callAs($this->makeUser('admin'), 'GET', '/api/v1/orders')->assertJsonPath('meta.total', 3);
    }

    public function test_anonymous_request_gets_401(): void
    {
        $this->callAs(null, 'GET', '/api/v1/orders')
            ->assertUnauthorized()
            ->assertJsonPath('error.code', 'UNAUTHENTICATED');
    }

    public function test_admin_cannot_place_orders(): void
    {
        $p = $this->makeProduct();

        $this->callAs($this->makeUser('admin'), 'POST', '/api/v1/orders', ['items' => [['product_id' => $p->id, 'quantity' => 1]]])
            ->assertForbidden();
    }

    public function test_total_is_calculated_from_catalog_prices(): void
    {
        $p = $this->makeProduct(['price' => '19.99']);

        $this->callAs($this->makeUser(), 'POST', '/api/v1/orders', ['items' => [['product_id' => $p->id, 'quantity' => 3]]])
            ->assertCreated()
            ->assertJsonPath('data.total', '59.97');
    }
}