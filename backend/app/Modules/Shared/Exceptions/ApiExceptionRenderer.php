<?php

namespace App\Modules\Shared\Exceptions;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Throwable;

/**
 * كل الأخطاء بتطلع من الـ API بنفس الشكل:
 * { "error": { "code": "...", "message": "...", "status": 000, "details": {...}? } }
 */
final class ApiExceptionRenderer
{
    public static function render(Throwable $e, Request $request): JsonResponse
    {
        $headers = $e instanceof HttpExceptionInterface ? $e->getHeaders() : [];

        [$status, $code, $message] = match (true) {
            $e instanceof ApiException => [$e->status, $e->errorCode, $e->getMessage()],
            $e instanceof ValidationException => [422, 'VALIDATION_ERROR', 'The given data was invalid.'],
            $e instanceof AuthenticationException,
            $e instanceof JWTException => [401, 'UNAUTHENTICATED', 'Authentication is required or the token is invalid.'],
            $e instanceof AccessDeniedHttpException,
            $e instanceof AuthorizationException => [403, 'FORBIDDEN', 'You are not allowed to perform this action.'],
            $e instanceof NotFoundHttpException => [404, 'NOT_FOUND', 'The requested resource was not found.'],
            $e instanceof MethodNotAllowedHttpException => [405, 'METHOD_NOT_ALLOWED', 'HTTP method not allowed for this endpoint.'],
            $e instanceof TooManyRequestsHttpException => [429, 'TOO_MANY_REQUESTS', 'Too many requests. Please try again later.'],
            $e instanceof HttpExceptionInterface => [$e->getStatusCode(), 'HTTP_ERROR', $e->getMessage() ?: 'HTTP error.'],
            default => [500, 'SERVER_ERROR', config('app.debug') ? $e->getMessage() : 'Internal server error.'],
        };

        $error = ['code' => $code, 'message' => $message, 'status' => $status];

        if ($e instanceof ValidationException) {
            $error['details'] = $e->errors();
        }

        return response()->json(['error' => $error], $status, $headers);
    }
}