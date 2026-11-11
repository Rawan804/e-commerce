<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * بنثبّت إعدادات الاختبار من الكود نفسه، بغض النظر عن متغيرات البيئة اللي بيحطها compose
     * (DB_CONNECTION=mysql و CACHE_STORE=redis). هيك الأمر العادي بيشتغل بدون أي -e:
     *   docker compose exec app php artisan test
     *
     * - قاعدة بيانات SQLite بالذاكرة: RefreshDatabase بيمسح الجداول، فممنوع يلمس MySQL الحقيقية.
     * - كاش array: حتى ما تتلوّث الاختبارات بـ Redis الحقيقي (أرقام المنتجات بتتكرر بين الاختبارات).
     */
    public function createApplication()
    {
        $app = parent::createApplication();

        $app['config']->set([
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => ':memory:',
            'database.connections.sqlite.url' => null,
            'cache.default' => 'array',
        ]);

        return $app;
    }

    /**
     * حماية إضافية: ما بنشغّل أي اختبار على قاعدة غير SQLite.
     */
    protected function setUpTraits()
    {
        $connection = $this->app['config']->get('database.default');

        if ($connection !== 'sqlite') {
            throw new \RuntimeException(
                "Refusing to run tests on '{$connection}' (RefreshDatabase would wipe it)."
            );
        }

        return parent::setUpTraits();
    }
}