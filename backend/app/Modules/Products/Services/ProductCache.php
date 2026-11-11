<?php

namespace App\Modules\Products\Services;

use Closure;
use Illuminate\Support\Facades\Cache;
use Throwable;

/**
 * تخزين مؤقت بالخادم (Redis) لردود المنتجات.
 *
 * ماذا نخزّن؟   ردود قراءة عامة وكتيرة الطلب: قائمة المنتجات، تفاصيل منتج، المنتجات المميزة.
 * ما منخزّن؟    الطلبات والإشعارات (خاصة بكل مستخدم وبتتغير)، ونتائج البحث q (كتيرة التنوع).
 * متى بتنتهي؟   بعد TTL (افتراضياً 60 ثانية) كحد أقصى.
 * متى منحذف؟    فوراً عند أي تعديل (إضافة/تعديل/حذف منتج، صورة، كمية، طلب جديد/إلغاء).
 *
 * طريقة الحذف: "رقم نسخة" (version) جزء من كل مفتاح. الحذف = تغيير الرقم، فكل المفاتيح القديمة
 * بتصير غير مستخدمة وبتروح لحالها بعد الـ TTL. هالطريقة شغّالة على أي نوع كاش وبعملية وحدة.
 */
class ProductCache
{
    private const VERSION_KEY = 'products:version';

    public function enabled(): bool
    {
        return (bool) config('performance.product_cache.enabled');
    }

    /**
     * @param  Closure():string  $build         بيبني الرد (JSON) من قاعدة البيانات
     * @param  Closure(string):bool|null  $shouldStore  لو رجّع false ما منخزّن النتيجة
     */
    public function remember(string $key, Closure $build, ?Closure $shouldStore = null): string
    {
        if (! $this->enabled()) {
            return $build();
        }

        try {
            $fullKey = 'products:'.Cache::get(self::VERSION_KEY, '0').':'.$key;
            $hit = Cache::get($fullKey);

            if (is_string($hit)) {
                return $hit; // Cache HIT: ما في استعلام ولا مناداة gRPC
            }
        } catch (Throwable $e) {
            report($e);

            return $build(); // Redis واقف: منكمّل من قاعدة البيانات بدل ما ينهار الـ API
        }

        $value = $build(); // Cache MISS

        if ($shouldStore === null || $shouldStore($value)) {
            try {
                Cache::put($fullKey, $value, (int) config('performance.product_cache.ttl', 60));
            } catch (Throwable $e) {
                report($e);
            }
        }

        return $value;
    }

    /** حذف كل ردود المنتجات المخزّنة (بتغيير رقم النسخة) */
    public function flush(): void
    {
        try {
            Cache::forever(self::VERSION_KEY, (string) microtime(true));
        } catch (Throwable $e) {
            report($e);
        }
    }
}
