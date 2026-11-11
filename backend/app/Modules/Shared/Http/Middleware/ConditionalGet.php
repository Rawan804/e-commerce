<?php

namespace App\Modules\Shared\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * التخزين المؤقت بـ HTTP (ETag):
 *  - الطلب الأول: الخادم بيرد بالبيانات ومعها بصمة (ETag) = md5 للمحتوى.
 *  - الطلبات التالية: المتصفح بيبعت If-None-Match بالبصمة.
 *      لو ما تغيّر المحتوى  -> 304 بدون بيانات (توفير على الشبكة).
 *      لو تغيّر             -> 200 ببيانات جديدة وبصمة جديدة.
 * بنطبّقه بس على المسارات العامة (المنتجات)، مش على بيانات خاصة بمستخدم.
 */
class ConditionalGet
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (! config('performance.http_cache.enabled')
            || ! $request->isMethodCacheable()
            || $response->getStatusCode() !== 200) {
            return $response;
        }

        $etag = '"'.md5((string) $response->getContent()).'"';

        $response->headers->set('ETag', $etag);
        // max-age=0 + must-revalidate: المتصفح يخزّن النسخة بس لازم يسأل الخادم كل مرة (If-None-Match)
        $response->headers->set('Cache-Control', 'public, max-age=0, must-revalidate');

        // SecurityHeaders بيحط no-store على كل شي؛ هالعلامة بتقوله "هاد الرد مقصود تخزينه"
        $request->attributes->set('http_cache_applied', true);

        if ($this->matches($request, $etag)) {
            $response->setNotModified(); // 304 + بدون جسم
        }

        return $response;
    }

    private function matches(Request $request, string $etag): bool
    {
        $header = $request->headers->get('If-None-Match');

        if ($header === null || $header === '') {
            return false;
        }

        if (trim($header) === '*') {
            return true;
        }

        foreach (explode(',', $header) as $candidate) {
            // بعض الوسطاء بيضيفوا W/ (weak) قدام البصمة
            $candidate = trim((string) preg_replace('#^W/#', '', trim($candidate)));

            if ($candidate === $etag) {
                return true;
            }
        }

        return false;
    }
}
