import { Chip } from '@mui/material'
import type { OrderStatus } from '@/features/orders'

interface OrderStatusChipProps {
  status: OrderStatus
  size?: 'small' | 'medium'
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: 'default' | 'warning' | 'info' | 'primary' | 'success' | 'error' }> = {
  pending:    { label: 'Pending',    color: 'default' },
  processing: { label: 'Processing', color: 'warning' },
  shipped:    { label: 'Shipped',    color: 'info' },
  delivered:  { label: 'Delivered',  color: 'success' },
  cancelled:  { label: 'Cancelled',  color: 'error' },
}

export default function OrderStatusChip({ status, size = 'small' }: OrderStatusChipProps) {
  const cfg = STATUS_CONFIG[status]
  return (
    <Chip
      label={cfg.label}
      color={cfg.color}
      size={size}
      variant="outlined"
      sx={{ fontWeight: 600 }}
    />
  )
}
