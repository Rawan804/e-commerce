<?php

namespace App\Modules\Orders\Services;

use App\Modules\Orders\Enums\OrderStatus;
use App\Modules\Orders\Events\OrderPlaced;
use App\Modules\Orders\Events\OrderStatusChanged;
use App\Modules\Orders\Models\Order;
use App\Modules\Orders\Models\OrderItem;
use App\Modules\Orders\Models\StockReleaseRequest;
use App\Modules\Orders\Jobs\ReleaseReservationStock;
use App\Modules\Products\Contracts\ProductCatalog;
use App\Modules\Products\Services\ProductCache;
use App\Services\WarehouseGrpcService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Modules\Shared\Exceptions\ApiException;
use Exception;
use Illuminate\Support\Facades\Log;
use Throwable;

class OrderService
{
    public function __construct(
        private readonly WarehouseGrpcService $warehouse,
        private readonly ProductCatalog $catalog,
        private readonly ProductCache $productCache,
    ) {}

    /**
     * Place a new order.
     *
     * Flow:
     *   1. Resolve product names + prices from the Products module.
     *   2. Attempt warehouse stock reservation (gRPC).
     *   3. Persist order + items inside a DB transaction.
     *   4. On DB failure → release the reservation (compensating action).
     *
     * @param  int    $userId
     * @param  array<array{product_id: int, quantity: int}>  $items
     */
    public function place(int $userId, array $items): Order
    {
        // 1. Resolve product data from the Products module (name + price)
        $productIds = array_column($items, 'product_id');
        $products   = $this->catalog->findByIds($productIds);

        // Validate all requested products exist
        foreach ($productIds as $id) {
            if (! isset($products[$id])) {
                throw new ApiException(422, 'PRODUCT_NOT_FOUND', "Product #{$id} does not exist.");
            }
        }

        // 2. Reserve stock via gRPC — atomic, all-or-nothing
        $reservationId = (string) Str::uuid();
        $shortages     = [];
        try {
            $reserved = $this->warehouse->reserveStock($items, $reservationId, $shortages);
        } catch (Throwable $e) {
            Log::error('Warehouse reservation failed.', [
                'reservation_id' => $reservationId,
                'user_id' => $userId,
                'items' => $items,
                'error' => $e->getMessage(),
            ]);

            // النتيجة مجهولة: ممكن المستودع نفّذ الحجز فعلاً ثم انتهت المهلة قبل ما يوصلنا الرد.
            // نجدول إرجاعاً (آمن لأنه idempotent) حتى ما تضيع الكمية المحجوزة.
            $this->compensateUncertainReservation($reservationId);

            throw new ApiException(503, 'WAREHOUSE_UNAVAILABLE',
                'The inventory service is temporarily unavailable. Please try again.');
        }

        if (! $reserved) {
            $detail = collect($shortages)->map(
                fn ($s) => "Product #{$s['product_id']}: requested {$s['requested']}, available {$s['available']}"
            )->join('; ');

            throw new ApiException(422, 'STOCK_INSUFFICIENT', "Insufficient stock: {$detail}");
        }

        // الكمية تغيّرت بالمستودع: نحذف كاش المنتجات حتى ما تظهر الكمية القديمة
        $this->productCache->flush();

        // 3. Persist order inside a transaction — if this fails, release the reservation
        try {
            $order = DB::transaction(function () use ($userId, $items, $products, $reservationId) {
                $total = collect($items)->sum(
                    fn ($item) => (float) $products[$item['product_id']]['price'] * $item['quantity']
                );

                $order = Order::create([
                    'user_id' => $userId,
                    'status'  => OrderStatus::Pending->value,
                    'total'   => $total,
                    'reservation_id' => $reservationId,
                ]);

                foreach ($items as $item) {
                    $product = $products[$item['product_id']];
                    OrderItem::create([
                        'order_id'     => $order->id,
                        'product_id'   => $item['product_id'],
                        'product_name' => $product['name'],
                        'unit_price'   => $product['price'],
                        'quantity'     => $item['quantity'],
                    ]);
                }

                return $order;
            });
        } catch (Exception $e) {
            Log::error('Order persistence failed after warehouse reservation.', [
                'reservation_id' => $reservationId,
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
            $releaseRequest = $this->createReleaseRequest($reservationId, null, 'persistence_failed');

            try {
                ReleaseReservationStock::dispatchSync($releaseRequest->id);
            } catch (Throwable $releaseError) {
                Log::error('Order persistence compensation could not be confirmed.', [
                    'reservation_id' => $reservationId,
                    'release_request_id' => $releaseRequest->id,
                    'error' => $releaseError->getMessage(),
                ]);

                // الإرجاع المباشر فشل (المستودع واقع): نسلّمه للـ queue ليعيد المحاولة
                // تلقائياً (tries=10, backoff=30s) بدل ما تضيع الكمية المحجوزة.
                $this->scheduleReleaseRetry($releaseRequest);
            }

            $this->productCache->flush();

            throw new ApiException(500, 'ORDER_CREATION_FAILED',
                'Order could not be saved and inventory compensation is pending confirmation.');
        }

        try {
            OrderPlaced::dispatch($order->id, $userId, (string) $order->total);
        } catch (Throwable $e) {
            Log::error('OrderPlaced event dispatch failed.', [
                'order_id' => $order->id,
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
        }

        return $order->load('items');
    }

    /**
     * Admin-only: transition an order to a new status.
     */
    public function changeStatus(Order $order, OrderStatus $next): Order
    {
        if (! $order->status->canTransitionTo($next)) {
            throw new ApiException(
                422,
                'INVALID_STATUS_TRANSITION',
                "Cannot transition from '{$order->status->value}' to '{$next->value}'."
            );
        }

        $from = $order->status->value;

        if ($next === OrderStatus::Cancelled && $order->reservation_id) {
            $releaseRequest = $this->createReleaseRequest(
                $order->reservation_id,
                $order->id,
                'order_cancelled'
            );

            try {
                ReleaseReservationStock::dispatchSync($releaseRequest->id);
            } catch (Throwable $e) {
                Log::error('Cancelled order inventory release is pending retry.', [
                    'order_id' => $order->id,
                    'reservation_id' => $order->reservation_id,
                    'release_request_id' => $releaseRequest->id,
                    'error' => $e->getMessage(),
                ]);

                throw new ApiException(503, 'WAREHOUSE_UNAVAILABLE',
                    'The order was not cancelled because inventory could not be released.');
            }

            // الكمية رجعت للمستودع: نحذف كاش المنتجات
            $this->productCache->flush();
        }

        $order->update(['status' => $next->value]);

        try {
            OrderStatusChanged::dispatch($order->id, $order->user_id, $from, $next->value);
        } catch (Throwable $e) {
            Log::error('OrderStatusChanged event dispatch failed.', [
                'order_id' => $order->id,
                'from' => $from,
                'to' => $next->value,
                'error' => $e->getMessage(),
            ]);
        }

        return $order->fresh('items');
    }

    private function compensateUncertainReservation(string $reservationId): void
    {
        try {
            $releaseRequest = $this->createReleaseRequest($reservationId, null, 'reserve_uncertain');
            $this->scheduleReleaseRetry($releaseRequest);
        } catch (Throwable $e) {
            Log::critical('Could not schedule release for an uncertain reservation.', [
                'reservation_id' => $reservationId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function scheduleReleaseRetry(StockReleaseRequest $releaseRequest): void
    {
        try {
            ReleaseReservationStock::dispatch($releaseRequest->id)->delay(now()->addSeconds(30));
        } catch (Throwable $e) {
            Log::critical('Stock release retry could not be queued; manual release required.', [
                'reservation_id' => $releaseRequest->reservation_id,
                'release_request_id' => $releaseRequest->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function createReleaseRequest(string $reservationId, ?int $orderId, string $reason): StockReleaseRequest
    {
        return StockReleaseRequest::query()->firstOrCreate(
            ['reservation_id' => $reservationId],
            [
                'order_id' => $orderId,
                'reason' => $reason,
                'status' => StockReleaseRequest::STATUS_PENDING,
            ]
        );
    }
}