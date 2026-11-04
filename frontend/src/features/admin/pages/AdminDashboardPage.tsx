import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Grid,
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
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined'
import PeopleOutlineOutlined from '@mui/icons-material/PeopleOutlineOutlined'
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined'
import AttachMoneyOutlined from '@mui/icons-material/AttachMoneyOutlined'
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined'
import { Link } from 'react-router-dom'
import { productsService } from '@/features/products/services/productsService'
import { usersService } from '@/features/users/services/usersService'
import { ordersService, type Order } from '@/features/orders'
import { formatCurrency, formatDate } from '@/shared/lib/formatters'
import { PATHS } from '@/shared/config/paths'
import StatCard from '../components/StatCard'
import OrderStatusChip from '../components/OrderStatusChip'
import OrderStatusDialog from '../components/OrderStatusDialog'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ products: 0, users: 0, orders: 0, revenue: 0 })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [lowStock, setLowStock] = useState<{ id: number; name: string; stock: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [statusTarget, setStatusTarget] = useState<Order | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [productRes, userRes, orderRes] = await Promise.all([
        productsService.list({ page: 1, perPage: 1000, filters: { search: '', category: 'All', sort: 'featured' } }),
        usersService.list({ page: 1, perPage: 1000, search: '' }),
        ordersService.list({ page: 1, perPage: 1000 }),
      ])
      const revenue = orderRes.items
        .filter((o) => o.status !== 'cancelled')
        .reduce((sum, o) => sum + o.total, 0)

      setStats({
        products: productRes.total,
        users: userRes.total,
        orders: orderRes.total,
        revenue,
      })
      setRecentOrders(orderRes.items.slice(0, 5))
      setLowStock(
        productRes.items
          .filter((p) => p.stock <= 10)
          .map((p) => ({ id: p.id, name: p.name, stock: p.stock }))
          .slice(0, 5),
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  async function handleStatusChange(orderId: string, status: import('@/features/orders').OrderStatus) {
    setStatusLoading(true)
    try {
      const updated = await ordersService.updateStatus(orderId, status)
      setRecentOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
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
        Dashboard
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Welcome back. Here's what's happening in your store.
      </Typography>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, lg: 3 }}>
                <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
              </Grid>
            ))
          : [
              { label: 'Total products', value: stats.products, icon: StorefrontOutlined, color: '#C4A7D7' },
              { label: 'Total users', value: stats.users, icon: PeopleOutlineOutlined, color: '#7BA7BC' },
              { label: 'Total orders', value: stats.orders, icon: ReceiptLongOutlined, color: '#B5C99A' },
              { label: 'Revenue (non-cancelled)', value: formatCurrency(stats.revenue), icon: AttachMoneyOutlined, color: '#D4A574' },
            ].map((s) => (
              <Grid key={s.label} size={{ xs: 12, sm: 6, lg: 3 }}>
                <StatCard label={s.label} value={s.value} icon={s.icon} color={s.color} />
              </Grid>
            ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent orders */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Recent orders
            </Typography>
            <Button component={Link} to={PATHS.adminOrders} size="small">
              View all
            </Button>
          </Stack>
          {loading ? (
            <Skeleton variant="rectangular" height={240} sx={{ borderRadius: 2 }} />
          ) : (
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Order</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentOrders.map((order) => (
                    <TableRow key={order.id} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {order.id}
                      </TableCell>
                      <TableCell>{order.address.fullName}</TableCell>
                      <TableCell>{formatCurrency(order.total)}</TableCell>
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
          )}
        </Grid>

        {/* Low stock */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Low stock alerts
            </Typography>
            <Button component={Link} to={PATHS.adminInventory} size="small">
              Manage
            </Button>
          </Stack>
          {loading ? (
            <Skeleton variant="rectangular" height={240} sx={{ borderRadius: 2 }} />
          ) : lowStock.length === 0 ? (
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 3, textAlign: 'center', color: 'text.secondary' }}>
              All products are well stocked.
            </Box>
          ) : (
            <Stack spacing={1}>
              {lowStock.map((p) => (
                <Box
                  key={p.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.5,
                    border: '1px solid',
                    borderColor: p.stock === 0 ? 'error.light' : 'warning.light',
                    borderRadius: 2,
                    bgcolor: p.stock === 0 ? 'error.50' : 'warning.50',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningAmberOutlined
                      fontSize="small"
                      sx={{ color: p.stock === 0 ? 'error.main' : 'warning.main' }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {p.name}
                    </Typography>
                  </Box>
                  <Chip
                    label={p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                    size="small"
                    color={p.stock === 0 ? 'error' : 'warning'}
                    variant="outlined"
                  />
                </Box>
              ))}
            </Stack>
          )}
        </Grid>
      </Grid>

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
