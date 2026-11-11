<?php

namespace App\Modules\Shared\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * مشكلة نسخة القراءة (Read Replica): النسخة بتتأخر شوي عن الأساسية.
 * لو المستخدم أنشأ طلب وبعدها فتح قائمة طلباته من النسخة المتأخرة، ما رح يلاقيه!
 *
 * الحل: بعد أي كتابة ناجحة من نفس العميل (IP) منعلّم "اقرأ من الأساسية"
 * لعدة ثواني (PERF_REPLICA_PIN_SECONDS)، وهالمدة أطول من تأخر النسخة العادي.
 * (ميزة sticky بلارافيل لحالها بتغطي نفس الطلب بس، مش الطلبات التالية.)
 */
class ReadYourWrites
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! config('performance.replica.enabled')) {
            return $next($request);
        }

        $key = 'ryw:'.$request->ip();

        try {
            if (Cache::has($key)) {
                DB::connection()->useWriteConnectionWhenReading();
            }
        } catch (Throwable $e) {
            // لو Redis واقف نقرأ من الأساسية للأمان
            DB::connection()->useWriteConnectionWhenReading();
        }

        $response = $next($request);

        if (! $request->isMethodSafe() && $response->getStatusCode() < 400) {
            try {
                Cache::put($key, 1, (int) config('performance.replica.pin_seconds', 5));
            } catch (Throwable $e) {
                report($e);
            }
        }

        return $response;
    }
}
