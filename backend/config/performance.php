<?php

/**
 * المتطلب الثالث: الأداء والتخزين المؤقت.
 * كل ميزة إلها مفتاح تشغيل/إيقاف من .env حتى نقيس "قبل" و"بعد" بنفس الكود.
 */
return [

    // (2) تخزين مؤقت بالخادم (Redis): قائمة المنتجات + تفاصيل المنتج
    'product_cache' => [
        'enabled' => (bool) env('PERF_PRODUCT_CACHE', true),
        'ttl' => (int) env('PERF_PRODUCT_CACHE_TTL', 60), // ثواني: سقف عمر البيانات حتى لو فاتنا حذفها
    ],

    // (1) تخزين مؤقت بالمتصفح (HTTP): ETag + 304
    'http_cache' => [
        'enabled' => (bool) env('PERF_HTTP_CACHE', true),
    ],

    // (4) نسخة القراءة: "اقرأ من الأساسية بعد ما تكتب" لفترة قصيرة
    'replica' => [
        // بيشتغل بس لو DB_READ_HOST معرّف ومختلف عن DB_HOST
        'enabled' => env('DB_READ_HOST') !== null
            && env('DB_READ_HOST') !== ''
            && env('DB_READ_HOST') !== env('DB_HOST', '127.0.0.1'),
        'pin_seconds' => (int) env('PERF_REPLICA_PIN_SECONDS', 5),
    ],
];
