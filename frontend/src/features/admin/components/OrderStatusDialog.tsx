import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { ORDER_STATUSES, type Order, type OrderStatus } from '@/features/orders'

interface OrderStatusDialogProps {
  order: Order | null
  loading?: boolean
  onClose: () => void
  onConfirm: (orderId: string, status: OrderStatus) => void
}

export default function OrderStatusDialog({
  order,
  loading = false,
  onClose,
  onConfirm,
}: OrderStatusDialogProps) {
  const [selected, setSelected] = useState<OrderStatus>(order?.status ?? 'pending')

  // Sync when order changes
  if (order && selected !== order.status && !loading) {
    setSelected(order.status)
  }

  return (
    <Dialog open={Boolean(order)} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Update order status</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Order <strong>{order?.id}</strong>
        </Typography>
        <FormControl fullWidth size="small">
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={selected}
            onChange={(e) => setSelected(e.target.value as OrderStatus)}
          >
            {ORDER_STATUSES.map((s) => (
              <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={loading || selected === order?.status}
          onClick={() => order && onConfirm(order.id, selected)}
        >
          {loading ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
