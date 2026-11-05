<?php

namespace App\Modules\Shared\Exceptions;

use RuntimeException;

/** خطأ منطقي بيطلع بصيغة الأخطاء الموحدة للـ API. */
class ApiException extends RuntimeException
{
    public function __construct(
        public readonly int $status,
        public readonly string $errorCode,
        string $message,
    ) {
        parent::__construct($message);
    }
}