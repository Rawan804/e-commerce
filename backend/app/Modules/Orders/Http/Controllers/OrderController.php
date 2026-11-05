<?php

namespace App\Modules\Orders\Http\Controllers;

use App\Modules\Orders\Enums\OrderStatus;
use App\Modules\Orders\Http\Requests\IndexOrdersRequest;
use App\Modules\Orders\Http\Requests\StoreOrderRequest;
use App\Modules\Orders\Http\Requests\UpdateOrderStatusRequest;
use App\Modules\Orders\Http\Resources\OrderResource;
use App\Modules\Orders\Models\Order;
use App\Modules\Orders\Services\OrderService;
use Illuminate\Support\Facades\Gate;

class OrderController
{
    public function __construct(private readonly OrderService $orders) {}

    public function store(StoreOrderRequest $request)
    {
        $order = $this->orders->place($request->user()->id, $request->validated('items'));

        return (new OrderResource($order))->response()->setStatusCode(201);
    }

    public function index(IndexOrdersRequest $request)
    {
        $user = $request->user();

        $orders = Order::query()
            ->with('items')
            // الزبون يشوف طلباته بس
            ->when(! $user->isAdmin(), fn ($q) => $q->where('user_id', $user->id))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->input('status')))
            ->latest('id')
            ->paginate((int) $request->input('per_page', 15))
            ->withQueryString();

        return OrderResource::collection($orders);
    }

    public function show(Order $order): OrderResource
    {
        // هون الإثبات: زبون بيفتح طلب غيره بيرجع 403
        Gate::authorize('view', $order);

        return new OrderResource($order->load('items'));
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): OrderResource
    {
        $updated = $this->orders->changeStatus($order, OrderStatus::from($request->validated('status')));

        return new OrderResource($updated);
    }
}