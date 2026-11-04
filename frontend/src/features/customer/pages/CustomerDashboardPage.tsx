import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import ShoppingBagOutlined from '@mui/icons-material/ShoppingBagOutlined'
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined'
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined'
import PersonOutlined from '@mui/icons-material/PersonOutlined'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { useCart } from '@/features/cart'
import { ordersService, type Order } from '@/features/orders'
import { formatCurrency, formatRelativeDate } from '@/shared/lib/formatters'
import { PATHS } from '@/shared/config/paths'
import OrderStatusChip from '@/features/admin/components/OrderStatusChip'

export default function CustomerDashboardPage() {
  const { user } = useAuth()
  const { count, total, openCart } = useCart()
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let active = true
    setOrdersLoading(true)
    ordersService
      .list({ page: 1, perPage: 3, userId: user.id })
      .then((res) => { if (active) setRecentOrders(res.items) })
      .finally(() => { if (active) setOrdersLoading(false) })
    return () => { active = false }
  }, [user])

  const firstName = user?.name.split(' ')[0] ?? 'there'

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      {/* Welcome */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
          Hi, {firstName} 👋
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Welcome to your account. Here's a summary of your activity.
        </Typography>
      </Box>

      {/* Quick-action cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            icon: StorefrontOutlined,
            label: 'Browse products',
            sub: 'Explore the full catalogue',
            to: PATHS.products,
            color: '#C4A7D7',
          },
          {
            icon: ReceiptLongOutlined,
            label: 'My Orders',
            sub: 'View your order history',
            to: PATHS.accountOrders,
            color: '#7BA7BC',
          },
          {
            icon: PersonOutlined,
            label: 'My Profile',
            sub: user?.email ?? '',
            to: PATHS.accountProfile,
            color: '#B5C99A',
          },
        ].map(({ icon: Icon, label, sub, to, color }) => (
          <Grid key={label} size={{ xs: 12, sm: 4 }}>
            <Card
              component={Link}
              to={to}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                textDecoration: 'none',
                color: 'text.primary',
                transition: 'transform 150ms ease, box-shadow 150ms ease',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 16px rgba(28,25,23,0.08)' },
              }}
            >
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: `${color}22`,
                  color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 700, lineHeight: 1.2 }}>{label}</Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {sub}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Cart summary */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <ShoppingBagOutlined color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Current cart
                </Typography>
              </Stack>
              {count === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                  <ShoppingBagOutlined sx={{ fontSize: 40, opacity: 0.3, mb: 1 }} />
                  <Typography variant="body2">Your cart is empty.</Typography>
                  <Button
                    component={Link}
                    to={PATHS.products}
                    size="small"
                    variant="outlined"
                    sx={{ mt: 1.5 }}
                  >
                    Start shopping
                  </Button>
                </Box>
              ) : (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography color="text.secondary">
                      {count} item{count !== 1 ? 's' : ''}
                    </Typography>
                    <Typography sx={{ fontWeight: 700 }}>{formatCurrency(total)}</Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={1}>
                    <Button variant="contained" fullWidth onClick={openCart}>
                      View cart
                    </Button>
                    <Button
                      component={Link}
                      to={PATHS.checkout}
                      variant="outlined"
                      fullWidth
                    >
                      Checkout
                    </Button>
                  </Stack>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent orders */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <ReceiptLongOutlined color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Recent orders
                  </Typography>
                </Stack>
                <Button component={Link} to={PATHS.accountOrders} size="small">
                  View all
                </Button>
              </Stack>

              {ordersLoading ? (
                <Stack spacing={1.5}>
                  {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={56} />)}
                </Stack>
              ) : recentOrders.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                  <Typography variant="body2">No orders yet.</Typography>
                  <Button
                    component={Link}
                    to={PATHS.products}
                    size="small"
                    variant="outlined"
                    sx={{ mt: 1.5 }}
                  >
                    Start shopping
                  </Button>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {recentOrders.map((order) => (
                    <Box
                      key={order.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        gap: 1,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.875rem' }}>
                          {order.id}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatRelativeDate(order.createdAt)} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography sx={{ fontWeight: 700 }}>{formatCurrency(order.total)}</Typography>
                        <OrderStatusChip status={order.status} />
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}
