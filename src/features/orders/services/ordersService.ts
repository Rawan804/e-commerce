/**
 * ordersService
 *
 * Laravel endpoints:
 *     GET    /orders?page=&per_page=&status=
 *     GET    /orders/{id}
 *     POST   /orders         { items: [{ product_id, quantity }] }
 *     PATCH  /orders/{id}/status  { status }
 *
 * Laravel OrderResource shape:
 *   {
 *     id, user_id, status, total,
 *     items: [{ product_id, product_name, unit_price, quantity, subtotal }],
 *     created_at, updated_at
 *   }
 *
 * Single resources are wrapped: { data: { ...order } }
 * Collections are wrapped:      { data: [...orders], meta: {...}, links: {...} }
 */

import { apiClient } from '@/shared/lib/apiClient'
import { env } from '@/shared/config/env'
import type { ApiError, PaginatedResponse } from '@/shared/types/api.types'
import type {
  CreateOrderPayload,
  Order,
  OrderItem,
  OrderPageResult,
  OrderQuery,
  OrderStatus,
} from '../types/order.types'

// ─── Backend DTO (Laravel OrderResource shape) ───────────────────────────────
interface OrderItemDto {
  product_id: number
  product_name: string
  unit_price: string | number
  quantity: number
  subtotal: string | number
}

interface OrderDto {
  id: number
  user_id: number
  user_name?: string | null
  status: OrderStatus
  total: string | number
  items?: OrderItemDto[]
  created_at: string
  updated_at: string
}

interface OrderDtoEnvelope {
  data: OrderDto
}

function getApiError(error: unknown, fallback: string): ApiError {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string' &&
    'status' in error
  ) {
    return error as ApiError
  }
  if (error instanceof Error) return { message: error.message, status: null }
  return { message: fallback, status: null }
}

export function orderErrorMessage(
  error: unknown,
  fallback: string,
  uncertainOutcomeMessage?: string,
): string {
  const apiError = getApiError(error, fallback)
  if (env.isDev) console.error('Orders API request failed:', apiError)
  if (apiError.status === 500) {
    return uncertainOutcomeMessage ?? 'The server could not complete this request. Please try again later.'
  }
  const validationMessages = apiError.errors
    ? Object.values(apiError.errors).flat().join(' ')
    : ''
  return validationMessages ? `${apiError.message} ${validationMessages}` : apiError.message
}

export function isOrderServerError(error: unknown): boolean {
  return getApiError(error, '').status === 500
}

function invalidCreatePayload(field: string, message: string): never {
  throw Object.assign(new Error(message), {
    status: 422,
    code: 'VALIDATION_ERROR',
    errors: { [field]: [message] },
  })
}

function mapOrderItem(item: OrderItemDto): OrderItem {
  return {
    productId: item.product_id,
    name: item.product_name,
    price: Number(item.unit_price),
    qty: item.quantity,
  }
}

function mapOrder(dto: OrderDto): Order {
  return {
    id: String(dto.id),
    userId: dto.user_id,
    userName: dto.user_name ?? null,
    items: (dto.items ?? []).map(mapOrderItem),
    total: Number(dto.total),
    status: dto.status,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

async function list(query: OrderQuery): Promise<OrderPageResult> {
  const res = await apiClient.get<PaginatedResponse<OrderDto>>('/orders', {
    params: {
      page: query.page,
      per_page: query.perPage,
      status: query.status !== 'all' ? query.status : undefined,
    },
  })
  return {
    items: res.data.map(mapOrder),
    total: res.meta.total,
    page: res.meta.current_page,
    perPage: res.meta.per_page,
    totalPages: Math.max(1, res.meta.last_page),
  }
}

async function getById(id: string): Promise<Order | null> {
  try {
    const res = await apiClient.get<OrderDtoEnvelope>(`/orders/${id}`)
    return mapOrder(res.data)
  } catch (e) {
    if ((e as { status?: number }).status === 404) return null
    throw e
  }
}

/**
 * Create an order. When using the real API, only product_id + quantity are
 * sent per item — the backend resolves names/prices from the Products module.
 */
async function create(payload: CreateOrderPayload): Promise<Order> {
  if (!Array.isArray(payload.items) || payload.items.length < 1 || payload.items.length > 50) {
    invalidCreatePayload('items', 'An order must contain between 1 and 50 items.')
  }
  const productIds = new Set<number>()
  payload.items.forEach((item, index) => {
    if (!Number.isSafeInteger(item.productId) || item.productId < 1) {
      invalidCreatePayload(`items.${index}.product_id`, 'Product IDs must be positive integers.')
    }
    if (productIds.has(item.productId)) {
      invalidCreatePayload(`items.${index}.product_id`, 'Each product may only appear once.')
    }
    if (!Number.isInteger(item.qty) || item.qty < 1 || item.qty > 100) {
      invalidCreatePayload(`items.${index}.quantity`, 'Quantity must be an integer from 1 to 100.')
    }
    productIds.add(item.productId)
  })

  const res = await apiClient.post<OrderDtoEnvelope>('/orders', {
    items: payload.items.map((item) => ({
      product_id: item.productId,
      quantity: item.qty,
    })),
  })
  return mapOrder(res.data)
}

async function updateStatus(id: string, status: OrderStatus): Promise<Order> {
  const res = await apiClient.patch<OrderDtoEnvelope>(`/orders/${id}/status`, { status })
  return mapOrder(res.data)
}

export const ordersService = { list, getById, create, updateStatus } as const
