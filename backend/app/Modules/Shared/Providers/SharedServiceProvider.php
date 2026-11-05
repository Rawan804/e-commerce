<?php

namespace App\Modules\Shared\Providers;

use App\Modules\Shared\Exceptions\ApiExceptionRenderer;
use App\Modules\Shared\Http\Middleware\ForceJsonResponse;
use App\Modules\Shared\Http\Middleware\SecurityHeaders;
use App\Modules\Users\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Contracts\Debug\ExceptionHandler;
use Illuminate\Foundation\Exceptions\Handler;
use Illuminate\Http\Request;
use Illuminate\Routing\Router;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Throwable;

class SharedServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // حارس JWT + موديل المستخدم تبعنا (بدون تعديل config/auth.php يدوياً)
        config([
            'auth.defaults.guard' => 'api',
            'auth.guards.api' => ['driver' => 'jwt', 'provider' => 'users'],
            'auth.providers.users.model' => User::class,
        ]);
    }

    public function boot(Router $router): void
    {
        // $router->prependMiddlewareToGroup('api', ForceJsonResponse::class);
        // $router->pushMiddlewareToGroup('api', SecurityHeaders::class);

        // حماية من تخمين كلمات المرور: 5 محاولات بالدقيقة لكل (إيميل + IP)
        RateLimiter::for('login', fn (Request $r) => Limit::perMinute(3)
            ->by(strtolower((string) $r->input('email')).'|'.$r->ip()));

        // أي خطأ بمسارات /api بيطلع بالصيغة الموحدة
        /** @var Handler $handler */
        $handler = $this->app->make(ExceptionHandler::class);

        $handler->renderable(
            function (Throwable $e, Request $request) {
                if ($request->is('api/*') || $request->expectsJson()) {
                    return ApiExceptionRenderer::render($e, $request);
                }

                return null;
            }
        );
    }
}