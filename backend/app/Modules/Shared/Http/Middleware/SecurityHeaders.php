<?php

namespace App\Modules\Shared\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->add([
            'X-Content-Type-Options' => 'nosniff',
            'X-Frame-Options' => 'DENY',
            'Referrer-Policy' => 'no-referrer',
            'Content-Security-Policy' => "default-src 'none'; frame-ancestors 'none'",
            'Permissions-Policy' => 'geolocation=(), camera=(), microphone=()',
            'Cross-Origin-Resource-Policy' => 'same-origin',
        ]);

        // الافتراضي: ما حدا يخزّن الردود. الاستثناء: المسارات العامة اللي طبّقنا عليها ConditionalGet (ETag)
        if (! $request->attributes->get('http_cache_applied', false)) {
            $response->headers->set('Cache-Control', 'no-store');
        }

        if ($request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        // بيشيل ترويسة PHP اللي بتكشف النسخة
        header_remove('X-Powered-By');

        return $response;
    }
}