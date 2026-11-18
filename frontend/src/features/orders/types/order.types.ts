// ─── Order domain types ────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
]

export const NEXT_ORDER_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
}

export interface OrderItem {
  productId: number
  name: string
  price: number
  qty: number
}

export interface Order {
  id: string
  userId: number
  userName: string | null
  items: OrderItem[]
  total: number
  status: OrderStatus
  createdAt: string
  updatedAt: string
}

export interface CreateOrderPayload {
  items: { productId: number; qty: number }[]
}

export interface OrderQuery {
  page: number
  perPage: number
  status?: OrderStatus | 'all'
}

export interface OrderPageResult {
  items: Order[]
  total: number
  page: number
  perPage: number
  totalPages: number
}
