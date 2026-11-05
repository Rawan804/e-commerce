// ─── Order domain types ────────────────────────────────────────────────────────

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]

export interface OrderAddress {
  fullName: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface OrderItem {
  productId: number
  name: string
  price: number
  qty: number
  image: string
}

export interface Order {
  id: string
  userId: number
  items: OrderItem[]
  subtotal: number
  shippingCost: number
  total: number
  address: OrderAddress
  status: OrderStatus
  createdAt: string
  updatedAt: string
}

export interface CreateOrderPayload {
  userId: number
  items: OrderItem[]
  subtotal: number
  shippingCost: number
  total: number
  address: OrderAddress
}

export interface OrderQuery {
  page: number
  perPage: number
  search?: string
  status?: OrderStatus | 'all'
  userId?: number
}

export interface OrderPageResult {
  items: Order[]
  total: number
  page: number
  perPage: number
  totalPages: number
}
