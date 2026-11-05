<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_login_and_me(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'Sara',
            'email' => 'sara@example.com',
            'password' => 'Password123',
        ])->assertCreated()
            ->assertJsonPath('data.user.role', 'customer')
            ->assertJsonStructure(['data' => ['access_token', 'token_type', 'expires_in']]);

        $token = $this->postJson('/api/v1/auth/login', [
            'email' => 'sara@example.com',
            'password' => 'Password123',
        ])->assertOk()->json('data.access_token');

        $this->app['auth']->forgetGuards(); // الحارس بيخزّن المستخدم السابق

        $this->withToken($token)->getJson('/api/v1/users/me')
            ->assertOk()
            ->assertJsonPath('data.email', 'sara@example.com');
    }
}