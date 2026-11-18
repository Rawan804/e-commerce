export { ordersService } from './services/ordersService'
export { isOrderServerError, orderErrorMessage, orderFromDto } from './services/ordersService'
export type { OrderDto } from './services/ordersService'
export { useAdminOrderPlaced, useOrderStatusUpdates } from './hooks/useOrderRealtime'
export type {
  Order,
  OrderItem,
  OrderStatus,
  OrderQuery,
  OrderPageResult,
  CreateOrderPayload,
} from './types/order.types'
export { ORDER_STATUSES, NEXT_ORDER_STATUSES } from './types/order.types'
