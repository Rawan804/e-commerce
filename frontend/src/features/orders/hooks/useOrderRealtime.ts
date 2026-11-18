import { useEffect, useRef } from 'react'
import { getEcho } from '@/shared/lib/realtime'
import { orderFromDto, type OrderDto } from '../services/ordersService'
import type { Order } from '../types/order.types'

interface OrderPlacedPayload { order: OrderDto }
interface OrderStatusPayload { order: OrderDto; from: string; to: string }

/**
 * Admin dashboard: fires when ANY customer places a new order.
 * Channel `admin.orders` is private — only admins are authorised by the backend.
 */
export function useAdminOrderPlaced(onPlaced: (order: Order) => void): void {
  const handler = useRef(onPlaced)
  useEffect(() => { handler.current = onPlaced })

  useEffect(() => {
    const channel = getEcho()
      .private('admin.orders')
      .listen('.order.placed', (e: OrderPlacedPayload) => {
        handler.current(orderFromDto(e.order))
      })
    return () => {
      channel.stopListening('.order.placed')
      getEcho().leave('admin.orders')
    }
  }, [])
}

/**
 * Customer order pages: fires when the status of one of THEIR orders changes.
 * One private channel per order (`orders.{id}`) — only the owner is authorised.
 */
export function useOrderStatusUpdates(
  orderIds: string[],
  onChange: (order: Order, from: string, to: string) => void,
): void {
  const handler = useRef(onChange)
  useEffect(() => { handler.current = onChange })

  const key = orderIds.join(',')
  useEffect(() => {
    const ids = key ? key.split(',') : []
    for (const id of ids) {
      getEcho()
        .private(`orders.${id}`)
        .listen('.order.status_changed', (e: OrderStatusPayload) => {
          handler.current(orderFromDto(e.order), e.from, e.to)
        })
    }
    return () => {
      for (const id of ids) getEcho().leave(`orders.${id}`)
    }
  }, [key])
}
