import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { ordersService, ORDER_STATUSES, type Order, type OrderStatus } from '@/features/orders'
import { formatCurrency, formatDate } from '@/shared/lib/formatters'
import ErrorMessage from '@/shared/components/feedback/ErrorMessage'
import EmptyState from '@/shared/components/feedback/EmptyState'
import ProductSearch from '@/features/products/components/ProductSearch'
import ProductPagination from '@/features/products/components/ProductPagination'
import OrderStatusChip from '../components/OrderStatusChip'
import OrderStatusDialog from '../components/OrderStatusDialog'
import { useDebounce } from '@/shared/hooks/useDebounce'

const PER_PAGE = 10

export default function AdminOrdersPage() {
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 350)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [page, setPage] = useState(1)

  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [statusTarget, setStatusTarget] = useState<Order | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null)

  useEffect(() => { setPage(1) }, [debouncedSearch, statusFilter])

  const load = useCallback(async () => {
    let active = true
    setLoading(true)
    setError(null)
    try {
      const res = await ordersService.list({
        page,
        perPage: PER_PAGE,
        search: debouncedSearch,
        status: statusFilter,
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
  }, [page, debouncedSearch, statusFilter])

  useEffect(() => { void load() }, [load])

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    setStatusLoading(true)
    try {
      const updated = await ordersService.updateStatus(orderId, status)
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
      setToast({ msg: `Order ${orderId} updated to "${status}".`, severity: 'success' })
    } catch {
      setToast({ msg: 'Failed to update order status.', severity: 'error' })
    } finally {
      setStatusLoading(false)
      setStatusTarget(null)
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
        Orders
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Manage and update customer order statuses.
      </Typography>

      {/* Toolbar */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <ProductSearch value={searchInput} onChange={setSearchInput} />
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
        <Skeleton variant="rectangular" height={360} sx={{ borderRadius: 2 }} />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders found"
          description="Try adjusting the search term or status filter."
        />
      ) : (
        <>
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', mb: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Order</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      {order.id}
                    </TableCell>
                    <TableCell>{order.address.fullName}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {formatCurrency(order.total)}
                    </TableCell>
                    <TableCell>
                      <OrderStatusChip status={order.status} />
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => setStatusTarget(order)}>
                        Update
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          <ProductPagination
            page={page}
            totalPages={totalPages}
            total={total}
            perPage={PER_PAGE}
            onChange={setPage}
          />
        </>
      )}

      <OrderStatusDialog
        order={statusTarget}
        loading={statusLoading}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleStatusChange}
      />

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? (
          <Alert severity={toast.severity} variant="filled" onClose={() => setToast(null)}>
            {toast.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Container>
  )
}
