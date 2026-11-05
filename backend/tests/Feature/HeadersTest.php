<?php

namespace Tests\Feature;

use Tests\TestCase;

class HeadersTest extends TestCase
{
    public function test_security_headers_are_present_even_on_errors(): void
    {
        $this->getJson('/api/v1/users/me')
            ->assertStatus(401)
            ->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('Referrer-Policy', 'no-referrer')
            ->assertHeader('Content-Security-Policy');
    }
}