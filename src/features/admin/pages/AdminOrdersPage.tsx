import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { isOrderServerError, NEXT_ORDER_STATUSES, orderErrorMessage, ordersService, ORDER_STATUSES, type Order, type OrderStatus } from '@/features/orders'
import { formatCurrency, formatDate } from '@/shared/lib/formatters'
import ErrorMessage from '@/shared/components/feedback/ErrorMessage'
import EmptyState from '@/shared/components/feedback/EmptyState'
import ProductPagination from '@/features/products/components/ProductPagination'
import OrderStatusChip from '../components/OrderStatusChip'
import OrderStatusDialog from '../components/OrderStatusDialog'

const PER_PAGE = 10

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [page, setPage] = useState(1)

  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [statusTarget, setStatusTarget] = useState<Order | null>(null)
  const [quickStatusTarget, setQuickStatusTarget] = useState<{
    order: Order
    status: OrderStatus
  } | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null)
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null)

  const load = useCallback(async () => {
    let active = true
    setLoading(true)
    setError(null)
    try {
      const res = await ordersService.list({
        page,
        perPage: PER_PAGE,
        status: statusFilter,
      })
      if (!active) return
      setOrders(res.items)
      setTotal(res.total)
      setTotalPages(res.totalPages)
    } catch (e) {
      if (active) setError(orderErrorMessage(e, 'Failed to load orders.'))
    } finally {
      if (active) setLoading(false)
    }
    return () => { active = false }
  }, [page, statusFilter])

  useEffect(() => { void load() }, [load])

  async function handleStatusChange(orderId: string, status: OrderStatus) {
    setStatusLoading(true)
    try {
      const updated = await ordersService.updateStatus(orderId, status)
      setOrders((prev) => prev.map((order) =>
        order.id === updated.id ? { ...updated, userName: order.userName } : order,
      ))
      await load()
      setToast({ msg: `Order ${orderId} updated to "${status}".`, severity: 'success' })
    } catch (error) {
      setToast({
        msg: orderErrorMessage(
          error,
          'Failed to update order status.',
          'The server returned an error after the status update. The order may have changed; the list is being refreshed.',
        ),
        severity: 'error',
      })
      if (isOrderServerError(error)) await load()
    } finally {
      setStatusLoading(false)
      setStatusTarget(null)
      setQuickStatusTarget(null)
    }
  }

  async function handleViewDetails(orderId: string) {
    setDetailOrderId(orderId)
    setDetailOrder(null)
    setDetailError(null)
    setDetailLoading(true)
    try {
      const result = await ordersService.getById(orderId)
      if (!result) {
        setDetailError('This order could not be found.')
        return
      }
      setDetailOrder(result)
    } catch (error) {
      setDetailError(orderErrorMessage(error, 'Could not load this order.'))
    } finally {
      setDetailLoading(false)
    }
  }

  function closeDetails() {
    setDetailOrderId(null)
    setDetailOrder(null)
    setDetailError(null)
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
        Orders
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Manage and update customer order statuses.
      </Typography>

      {/* Status filter */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 160 }} size="small">
          <InputLabel>Status</InputLabel>
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => {
              setPage(1)
              setStatusFilter(e.target.value)
            }}
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
          description="Try selecting a different status filter."
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
                    <TableCell>{order.userName ?? `User #${order.userId}`}</TableCell>
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
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.5}>
                        <Button size="small" disabled={statusLoading} onClick={() => { void handleViewDetails(order.id) }}>
                          Details
                        </Button>
                        {order.status === 'pending' &&
                          NEXT_ORDER_STATUSES[order.status].includes('confirmed') && (
                            <Button
                              size="small"
                              disabled={statusLoading}
                              onClick={() => { setQuickStatusTarget({ order, status: 'confirmed' }); }}
                            >
                              Accept
                            </Button>
                        )}
                        {order.status === 'pending' &&
                          NEXT_ORDER_STATUSES[order.status].includes('cancelled') && (
                            <Button
                              size="small"
                              color="error"
                              disabled={statusLoading}
                              onClick={() => { setQuickStatusTarget({ order, status: 'cancelled' }); }}
                            >
                              Reject
                            </Button>
                        )}
                        {order.status !== 'pending' && NEXT_ORDER_STATUSES[order.status].length > 0 && (
                          <Button size="small" disabled={statusLoading} onClick={() => { setStatusTarget(order); }}>
                            Update
                          </Button>
                        )}
                      </Stack>
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
        onClose={() => { setStatusTarget(null); }}
        onConfirm={handleStatusChange}
      />

      <Dialog
        open={quickStatusTarget !== null}
        onClose={() => {
          if (!statusLoading) setQuickStatusTarget(null)
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {quickStatusTarget?.status === 'confirmed' ? 'Accept order?' : 'Reject order?'}
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            {quickStatusTarget
              ? quickStatusTarget.status === 'confirmed'
                ? `Accept order ${quickStatusTarget.order.id}? Its existing stock reservation will remain in place.`
                : `Reject order ${quickStatusTarget.order.id}? Reserved stock will be released before the order is cancelled.`
              : ''}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => { setQuickStatusTarget(null); }} disabled={statusLoading}>
            Keep order
          </Button>
          <Button
            variant="contained"
            color={quickStatusTarget?.status === 'cancelled' ? 'error' : 'primary'}
            disabled={statusLoading || quickStatusTarget === null}
            onClick={() => {
              if (quickStatusTarget) {
                void handleStatusChange(quickStatusTarget.order.id, quickStatusTarget.status)
              }
            }}
          >
            {statusLoading
              ? 'Saving…'
              : quickStatusTarget?.status === 'confirmed'
                ? 'Accept order'
                : 'Reject order'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailOrderId !== null} onClose={closeDetails} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Order details</DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Skeleton variant="rectangular" height={160} />
          ) : detailError ? (
            <Alert severity="error">{detailError}</Alert>
          ) : detailOrder ? (
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">Order #{detailOrder.id}</Typography>
                <Typography>{detailOrder.userName ?? `User #${detailOrder.userId}`}</Typography>
                <Typography sx={{ textTransform: 'capitalize' }}>Status: {detailOrder.status}</Typography>
                <Typography>Total: {formatCurrency(detailOrder.total)}</Typography>
                <Typography variant="body2" color="text.secondary">{formatDate(detailOrder.createdAt)}</Typography>
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Items</Typography>
              {detailOrder.items.map((item) => (
                <Box key={item.productId} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                  <Typography>{item.name} × {item.qty}</Typography>
                  <Typography>{formatCurrency(item.price * item.qty)}</Typography>
                </Box>
              ))}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetails}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3500}
        onClose={() => { setToast(null); }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? (
          <Alert severity={toast.severity} variant="filled" onClose={() => { setToast(null); }}>
            {toast.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Container>
  )
}
