import { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Alert,
  Chip,
  Collapse,
  Container,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import ExpandMoreOutlined from '@mui/icons-material/ExpandMoreOutlined'
import ExpandLessOutlined from '@mui/icons-material/ExpandLessOutlined'
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined'
import { orderErrorMessage, ordersService, ORDER_STATUSES, type Order, type OrderStatus } from '@/features/orders'
import { formatCurrency, formatRelativeDate } from '@/shared/lib/formatters'
import { PATHS } from '@/shared/config/paths'
import ErrorMessage from '@/shared/components/feedback/ErrorMessage'
import EmptyState from '@/shared/components/feedback/EmptyState'
import ProductPagination from '@/features/products/components/ProductPagination'
import OrderStatusChip from '@/features/admin/components/OrderStatusChip'

const PER_PAGE = 5

// ─── Order detail expand panel ────────────────────────────────────────────────
function OrderDetailPanel({ order }: { order: Order }) {
  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        borderTop: '1px solid',
        borderColor: 'divider',
        px: 2,
        py: 2,
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
        Items
      </Typography>
      <Stack spacing={1} sx={{ mb: 2 }}>
        {order.items.map((item) => (
          <Box
            key={item.productId}
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Typography variant="body2">
              {item.name}{' '}
              <Typography component="span" variant="body2" color="text.secondary">
                × {item.qty}
              </Typography>
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatCurrency(item.price * item.qty)}
            </Typography>
          </Box>
        ))}
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 3, flexWrap: 'wrap' }}
      >
        {/* Persisted order total */}
        <Stack spacing={0.5} sx={{ minWidth: 180 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>Total</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {formatCurrency(order.total)}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Box>
  )
}

// ─── Single order row ─────────────────────────────────────────────────────────
function OrderRow({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false)
  const [details, setDetails] = useState<Order | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)

  async function toggleDetails() {
    const shouldExpand = !expanded
    setExpanded(shouldExpand)
    if (!shouldExpand || details || detailsLoading) return

    setDetailsLoading(true)
    setDetailsError(null)
    try {
      const result = await ordersService.getById(order.id)
      if (!result) {
        setDetailsError('This order could not be found.')
        return
      }
      setDetails(result)
    } catch (error) {
      setDetailsError(orderErrorMessage(error, 'Could not load this order.'))
    } finally {
      setDetailsLoading(false)
    }
  }

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* Header row */}
      <Box
        onClick={() => { void toggleDetails() }}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            void toggleDetails()
          }
        }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          cursor: 'pointer',
          bgcolor: 'background.paper',
          gap: 1,
          flexWrap: 'wrap',
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', flex: 1 }}>
          <Typography
            sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.9rem', minWidth: 100 }}
          >
            {order.id}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatRelativeDate(order.createdAt)}
          </Typography>
          <Chip
            label={`${order.items.length} item${order.items.length !== 1 ? 's' : ''}`}
            size="small"
            sx={{ bgcolor: 'action.hover' }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography sx={{ fontWeight: 700 }}>{formatCurrency(order.total)}</Typography>
          <OrderStatusChip status={order.status} />
          {expanded ? <ExpandLessOutlined fontSize="small" color="action" /> : <ExpandMoreOutlined fontSize="small" color="action" />}
        </Box>
      </Box>

      {/* Expandable detail */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        {detailsLoading ? (
          <Skeleton variant="rectangular" height={120} />
        ) : detailsError ? (
          <Alert severity="error">{detailsError}</Alert>
        ) : details ? (
          <OrderDetailPanel order={details} />
        ) : null}
      </Collapse>
    </Box>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CustomerOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [page, setPage] = useState(1)

  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { setPage(1) }, [statusFilter])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await ordersService.list({
        page,
        perPage: PER_PAGE,
        status: statusFilter,
      })
      setOrders(res.items)
      setTotal(res.total)
      setTotalPages(res.totalPages)
    } catch (e) {
      setError(orderErrorMessage(e, 'Failed to load orders.'))
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => { void load() }, [load])

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack direction="row" spacing={1.5} sx={{ mb: 0.5, alignItems: 'center' }}>
        <ReceiptLongOutlined color="primary" fontSize="large" aria-hidden />
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
          My Orders
        </Typography>
      </Stack>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {total > 0 ? `${total} order${total !== 1 ? 's' : ''} placed` : 'Your order history.'}
      </Typography>

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 160 }} size="small">
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); }}
          >
            <MenuItem value="all">All statuses</MenuItem>
            {ORDER_STATUSES.map((s) => (
              <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {error ? (
        <ErrorMessage error={error} onRetry={load} />
      ) : loading ? (
        <Stack spacing={2}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={64} />
          ))}
        </Stack>
      ) : orders.length === 0 ? (
        <EmptyState
          Icon={ReceiptLongOutlined}
          title={statusFilter !== 'all' ? 'No orders match this status' : 'No orders yet'}
          description={
            statusFilter !== 'all'
              ? 'Try selecting a different status.'
              : 'Browse the catalogue and place your first order.'
          }
          actionLabel="Browse products"
          onAction={() => { window.location.href = PATHS.products }}
        />
      ) : (
        <>
          <Stack spacing={2} sx={{ mb: 3 }}>
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </Stack>
          <ProductPagination
            page={page}
            totalPages={totalPages}
            total={total}
            perPage={PER_PAGE}
            onChange={setPage}
          />
        </>
      )}
    </Container>
  )
}
