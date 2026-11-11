<?php

namespace App\Services;

use Warehouse\V1\GetStockRequest;
use Warehouse\V1\ReserveStockRequest;
use Warehouse\V1\ReleaseStockRequest;
use Warehouse\V1\StockItem;
use Warehouse\V1\WarehouseClient;
use Illuminate\Support\Facades\Log;
use Exception;

class WarehouseGrpcService
{
    protected WarehouseClient $client;

    // Channel timeout is in milliseconds.
    private const DEFAULT_TIMEOUT_MS = 5000;

    // Per-call gRPC timeout is in microseconds.
    private const DEFAULT_TIMEOUT_US = 5_000_000;

    // Reads for product pages use a short deadline, so a hung warehouse can't stall listings.
    private const READ_TIMEOUT_US = 1_000_000;

    public function __construct()
    {
        $host = config('services.warehouse.host', 'warehouse:50051');

        $this->client = new WarehouseClient($host, [
            'credentials' => \Grpc\ChannelCredentials::createInsecure(),
            'grpc.default_call_timeout_ms' => self::DEFAULT_TIMEOUT_MS,
        ]);
    }

    /**
     * Returns available stock quantity for a product.
     * Returns 0 if the product is not registered in the warehouse.
     * Throws on service unavailability.
     */
    public function getStock(int $productId): int
    {
        $request = new GetStockRequest();
        $request->setProductId($productId);

        [$response, $status] = $this->client->GetStock(
            $request,
            [],
            ['timeout' => self::READ_TIMEOUT_US]
        )->wait();

        if ($status->code === \Grpc\STATUS_NOT_FOUND) {
            return 0;
        }

        if ($status->code !== \Grpc\STATUS_OK) {
            throw new Exception(
                "Warehouse GetStock error: " . $status->details,
                503
            );
        }

        // Proto field: available (not quantity)
        return $response->getAvailable();
    }

    /**
     * Reserves stock for all items atomically.
     * Returns true on success.
     * Returns false when stock is insufficient (sets $shortages).
     * Throws on service errors.
     *
     * @param array<array{product_id: int, quantity: int}> $items
     * @param string $reservationId Unique ID linking reservation to the order
     * @param array &$shortages Populated with shortage details on failure
     */
    public function reserveStock(
        array $items,
        string $reservationId,
        array &$shortages = []
    ): bool {
        $request = new ReserveStockRequest();
        $request->setReservationId($reservationId);

        $stockItems = [];

        foreach ($items as $item) {
            $stockItem = new StockItem();
            $stockItem->setProductId((int) $item['product_id']);
            $stockItem->setQuantity((int) $item['quantity']);
            $stockItems[] = $stockItem;
        }

        $request->setItems($stockItems);

        [$response, $status] = $this->client->ReserveStock(
            $request,
            [],
            ['timeout' => self::DEFAULT_TIMEOUT_US]
        )->wait();

        if ($status->code !== \Grpc\STATUS_OK) {
            throw new Exception(
                "Warehouse ReserveStock error: " . $status->details,
                $this->statusCode($status)
            );
        }

        if (! $response->getReserved()) {
            foreach ($response->getShortages() as $shortage) {
                $shortages[] = [
                    'product_id' => $shortage->getProductId(),
                    'requested' => $shortage->getRequested(),
                    'available' => $shortage->getAvailable(),
                ];
            }

            return false;
        }

        return true;
    }

    /**
     * Releases a previously reserved stock.
     * Idempotent — safe to call more than once for the same reservationId.
     */
    public function releaseStock(string $reservationId): bool
    {
        try {
            $request = new ReleaseStockRequest();
            $request->setReservationId($reservationId);

            [$response, $status] = $this->client->ReleaseStock(
                $request,
                [],
                ['timeout' => self::DEFAULT_TIMEOUT_US]
            )->wait();

            if ($status->code !== \Grpc\STATUS_OK) {
                Log::warning(
                    "ReleaseStock non-OK for reservation {$reservationId}: "
                    . $status->details
                );

                throw new Exception(
                    "Warehouse ReleaseStock error: " . $status->details,
                    $this->statusCode($status)
                );
            }

            return $response->getReleased();
        } catch (Exception $e) {
            Log::error(
                "ReleaseStock failed for reservation {$reservationId}: "
                . $e->getMessage()
            );

            throw $e;
        }
    }

    private function statusCode(object $status): int
    {
        return in_array(
            $status->code,
            [
                \Grpc\STATUS_UNAVAILABLE,
                \Grpc\STATUS_DEADLINE_EXCEEDED,
            ],
            true
        ) ? 503 : 502;
    }
}