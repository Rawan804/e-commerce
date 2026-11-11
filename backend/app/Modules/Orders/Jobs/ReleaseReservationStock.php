<?php

namespace App\Modules\Orders\Jobs;

use App\Modules\Orders\Models\StockReleaseRequest;
use App\Services\WarehouseGrpcService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class ReleaseReservationStock implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 10;
    public int $backoff = 30;

    public function __construct(private readonly int $releaseRequestId) {}

    public function handle(WarehouseGrpcService $warehouse): void
    {
        $request = DB::transaction(function () {
            $request = StockReleaseRequest::query()->lockForUpdate()->findOrFail($this->releaseRequestId);

            if ($request->status === StockReleaseRequest::STATUS_RELEASED) {
                return null;
            }

            if (
                $request->status === StockReleaseRequest::STATUS_RELEASING
                && $request->updated_at->gt(now()->subMinutes(2))
            ) {
                return null;
            }

            $request->forceFill([
                'status' => StockReleaseRequest::STATUS_RELEASING,
                'attempts' => $request->attempts + 1,
                'last_error' => null,
            ])->save();

            return $request;
        });

        if ($request === null) {
            return;
        }

        try {
            $released = $warehouse->releaseStock($request->reservation_id);

            // reserve_uncertain: ممكن الحجز ما صار أصلاً، فـ released=false يعني "ما في شي لإرجاعه" وهذا نجاح.
            if (! $released && $request->reason !== 'reserve_uncertain') {
                throw new \RuntimeException('Warehouse did not confirm stock release.');
            }

            $request->forceFill([
                'status' => StockReleaseRequest::STATUS_RELEASED,
                'released_at' => now(),
                'last_error' => null,
            ])->save();
        } catch (Throwable $e) {
            $request->forceFill([
                'status' => StockReleaseRequest::STATUS_FAILED,
                'last_error' => $e->getMessage(),
            ])->save();

            Log::error('Warehouse stock release failed.', [
                'release_request_id' => $request->id,
                'reservation_id' => $request->reservation_id,
                'order_id' => $request->order_id,
                'reason' => $request->reason,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}