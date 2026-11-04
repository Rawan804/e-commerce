import { useCallback, useEffect, useState } from 'react'
import {
  Box,
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
import { useAuth } from '@/features/auth'
import { ordersService, ORDER_STATUSES, type Order, type OrderStatus } from '@/features/orders'
import { formatCurrency, formatRelativeDate } from '@/shared/lib/formatters'
import { PATHS } from '@/shared/config/paths'
import { useDebounce } from '@/shared/hooks/useDebounce'
import ErrorMessage from '@/shared/components/feedback/ErrorMessage'
import EmptyState from '@/shared/components/feedback/EmptyState'
import ProductSearch from '@/features/products/components/ProductSearch'
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
        {/* Shipping address */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
            Shipping address
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {order.address.fullName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {order.address.addressLine1}
            {order.address.addressLine2 ? `, ${order.address.addressLine2}` : ''}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {order.address.city}, {order.address.state} {order.address.postalCode}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {order.address.country}
          </Typography>
        </Box>

        {/* Price breakdown */}
        <Stack spacing={0.5} sx={{ minWidth: 180 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Subtotal</Typography>
            <Typography variant="body2">{formatCurrency(order.subtotal)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Shipping</Typography>
            <Typography variant="body2">
              {order.shippingCost === 0 ? 'Free' : formatCurrency(order.shippingCost)}
            </Typography>
          </Box>
          <Divider />
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
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpanded((v) => !v) }}
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
        <OrderDetailPanel order={order} />
      </Collapse>
    </Box>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CustomerOrdersPage() {
  const { user } = useAuth()

  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 350)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [page, setPage] = useState(1)

  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { setPage(1) }, [debouncedSearch, statusFilter])

  const load = useCallback(async () => {
    if (!user) return
    let active = true
    setLoading(true)
    setError(null)
    try {
      const res = await ordersService.list({
        page,
        perPage: PER_PAGE,
        search: debouncedSearch,
        status: statusFilter,
        userId: user.id,
      })
      if (!active) return
      setOrders(res.items)
      setTotal(res.total)
      setTotalPages(res.totalPages)
    } catch (e) {
      if (active) setError(e instanceof Error ? e.message : 'Failed to load orders.')
    } finally {
      if (active) setLoading(false)
    }
    return () => { active = false }
  }, [user, page, debouncedSearch, statusFilter])

  useEffect(() => { void load() }, [load])

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
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
        <Box sx={{ flex: 1 }}>
          <ProductSearch
            value={searchInput}
            onChange={setSearchInput}
            label="Search orders"
            placeholder="Search by order ID or product name…"
          />
        </Box>
        <FormControl sx={{ minWidth: 160 }} size="small">
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
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
          title={debouncedSearch || statusFilter !== 'all' ? 'No orders match your filters' : 'No orders yet'}
          description={
            debouncedSearch || statusFilter !== 'all'
              ? 'Try adjusting the search or status filter.'
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
