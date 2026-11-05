<?php

namespace App\Modules\Products\Contracts;

/**
 * الواجهة العامة لوحدة المنتجات.
 * الوحدات التانية (الطلبات) بتستخدمها بدل ما تقرأ جدول products مباشرة.
 */
interface ProductCatalog
{
    /**
     * @param  int[]  $ids
     * @return array<int, array{id:int, name:string, price:string}>  المفتاح هو رقم المنتج
     */
    public function findByIds(array $ids): array;
}