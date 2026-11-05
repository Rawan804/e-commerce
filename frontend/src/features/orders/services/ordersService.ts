/**
 * ordersService
 *
 * VITE_USE_MOCK=true  (default) → in-memory demo data.
 * VITE_USE_MOCK=false           → real API endpoints:
 *     GET    /orders?page=&per_page=&search=&status=&user_id=
 *     GET    /orders/{id}
 *     POST   /orders
 *     PATCH  /orders/{id}/status  { status }
 */

import { env } from '@/shared/config/env'
import { apiClient } from '@/shared/lib/apiClient'
import { SEED_ORDERS } from '../data/seedOrders'
import type {
  CreateOrderPayload,
  Order,
  OrderPageResult,
  OrderQuery,
  OrderStatus,
} from '../types/order.types'

// ─── Mock store ───────────────────────────────────────────────────────────────
let store: Order[] = [...SEED_ORDERS]
let nextOrderNum = SEED_ORDERS.length + 1

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

function padId(n: number): string {
  return `ORD-${String(n).padStart(4, '0')}`
}

// ─── Mock implementations ─────────────────────────────────────────────────────

function mockList(query: OrderQuery): OrderPageResult {
  let filtered = [...store]

  if (query.userId !== undefined) {
    filtered = filtered.filter((o) => o.userId === query.userId)
  }
  if (query.status && query.status !== 'all') {
    filtered = filtered.filter((o) => o.status === query.status)
  }
  if (query.search?.trim()) {
    const q = query.search.trim().toLowerCase()
    filtered = filtered.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.address.fullName.toLowerCase().includes(q) ||
        o.items.some((i) => i.name.toLowerCase().includes(q)),
    )
  }

  // Sort newest first
  filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / query.perPage))
  const page = Math.min(Math.max(query.page, 1), totalPages)
  const start = (page - 1) * query.perPage

  return {
    items: filtered.slice(start, start + query.perPage),
    total,
    page,
    perPage: query.perPage,
    totalPages,
  }
}

function mockGetById(id: string): Order | null {
  return store.find((o) => o.id === id) ?? null
}

function mockCreate(payload: CreateOrderPayload): Order {
  const now = new Date().toISOString()
  const order: Order = {
    id: padId(nextOrderNum++),
    ...payload,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  }
  store = [order, ...store]
  return order
}

function mockUpdateStatus(id: string, status: OrderStatus): Order {
  const idx = store.findIndex((o) => o.id === id)
  if (idx === -1) throw new Error(`Order ${id} not found`)
  const updated = { ...store[idx], status, updatedAt: new Date().toISOString() }
  store = store.map((o, i) => (i === idx ? updated : o))
  return updated
}

// ─── Public API ───────────────────────────────────────────────────────────────

async function list(query: OrderQuery): Promise<OrderPageResult> {
  if (!env.useMock) {
    const res = await apiClient.get<OrderPageResult>('/orders', {
      params: {
        page: query.page,
        per_page: query.perPage,
        search: query.search || undefined,
        status: query.status !== 'all' ? query.status : undefined,
        user_id: query.userId,
      },
    })
    return res
  }
  return delay(mockList(query))
}

async function getById(id: string): Promise<Order | null> {
  if (!env.useMock) {
    return apiClient.get<Order>(`/orders/${id}`)
  }
  return delay(mockGetById(id))
}

async function create(payload: CreateOrderPayload): Promise<Order> {
  if (!env.useMock) {
    return apiClient.post<Order>('/orders', payload)
  }
  await delay(undefined, 500)
  return mockCreate(payload)
}

async function updateStatus(id: string, status: OrderStatus): Promise<Order> {
  if (!env.useMock) {
    return apiClient.patch<Order>(`/orders/${id}/status`, { status })
  }
  await delay(undefined, 300)
  return mockUpdateStatus(id, status)
}

export const ordersService = { list, getById, create, updateStatus } as const
