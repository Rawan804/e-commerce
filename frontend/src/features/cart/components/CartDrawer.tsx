import { useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import CloseOutlined from '@mui/icons-material/CloseOutlined'
import RemoveOutlined from '@mui/icons-material/RemoveOutlined'
import AddOutlined from '@mui/icons-material/AddOutlined'
import DeleteOutline from '@mui/icons-material/DeleteOutlineOutlined'
import ShoppingBagOutlined from '@mui/icons-material/ShoppingBagOutlined'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { formatCurrency } from '@/shared/lib/formatters'
import { PATHS } from '@/shared/config/paths'
import { useAuth } from '@/features/auth'
import ProductImage from '@/features/products/components/ProductImage'

export default function CartDrawer() {
  const { items, total, count, isCartOpen, closeCart, updateQty, removeItem, clearCart } =
    useCart()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  function handleCheckout() {
    if (isAuthenticated) {
      closeCart()
      navigate(PATHS.checkout)
    } else {
      setCheckoutOpen(true)
    }
  }

  const closeCheckout = () => setCheckoutOpen(false)

  function placeDemoOrder() {
    clearCart()
    setCheckoutOpen(false)
    closeCart()
  }

  return (
    <>
      <Drawer
        anchor="right"
        open={isCartOpen}
        onClose={closeCart}
        slotProps={{
          paper: {
            sx: { width: { xs: '100%', sm: 400 }, maxWidth: '100%' },
            role: 'dialog',
            'aria-label': 'Shopping cart',
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Your cart {count > 0 && `(${count})`}
          </Typography>
          <IconButton onClick={closeCart} aria-label="Close cart">
            <CloseOutlined />
          </IconButton>
        </Box>

        {items.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              flex: 1,
              p: 4,
              color: 'text.secondary',
              textAlign: 'center',
            }}
          >
            <ShoppingBagOutlined sx={{ fontSize: 64, opacity: 0.35 }} aria-hidden="true" />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Your cart is empty
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                Browse the catalogue and add something you love.
              </Typography>
            </Box>
            <Button
              component={Link}
              to={PATHS.products}
              onClick={closeCart}
              variant="contained"
            >
              Continue shopping
            </Button>
          </Box>
        ) : (
          <>
            {/* Items */}
            <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 2 }}>
              <Stack divider={<Divider flexItem />} spacing={2}>
                {items.map((item) => (
                  <Box
                    key={item.productId}
                    sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}
                  >
                    <Box sx={{ width: 72, height: 72, flexShrink: 0, borderRadius: 1, overflow: 'hidden' }}>
                      <ProductImage src={item.image} alt={item.name} aspectRatio="1 / 1" />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {item.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                        {formatCurrency(item.price)} each
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                        {/* Quantity stepper */}
                        <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                          <IconButton
                            size="small"
                            aria-label={`Decrease quantity of ${item.name}`}
                            onClick={() => updateQty(item.productId, item.qty - 1)}
                          >
                            <RemoveOutlined fontSize="small" />
                          </IconButton>
                          <Typography sx={{ minWidth: 28, textAlign: 'center', fontWeight: 600 }} aria-live="polite">
                            {item.qty}
                          </Typography>
                          <IconButton
                            size="small"
                            aria-label={`Increase quantity of ${item.name}`}
                            disabled={item.qty >= item.stock}
                            onClick={() => updateQty(item.productId, item.qty + 1)}
                          >
                            <AddOutlined fontSize="small" />
                          </IconButton>
                        </Box>
                        <IconButton
                          size="small"
                          aria-label={`Remove ${item.name} from cart`}
                          onClick={() => removeItem(item.productId)}
                          sx={{ color: 'text.secondary' }}
                        >
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    <Typography sx={{ fontWeight: 700, flexShrink: 0 }} variant="body2">
                      {formatCurrency(item.price * item.qty)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>

            {/* Footer */}
            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Subtotal
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {formatCurrency(total)}
                </Typography>
              </Box>
              <Button fullWidth variant="contained" size="large" onClick={handleCheckout}>
                Checkout
              </Button>
              <Button
                fullWidth
                component={Link}
                to={PATHS.products}
                onClick={closeCart}
                sx={{ mt: 1 }}
              >
                Continue shopping
              </Button>
            </Box>
          </>
        )}
      </Drawer>

      {/* Demo checkout confirmation */}
      <Dialog open={checkoutOpen} onClose={closeCheckout} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Demo checkout</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This is a demo storefront, so payment is not connected to a real
            provider. Your card will not be charged. Clicking &quot;Place demo
            order&quot; clears the cart and confirms the order for
            {' '}
            <strong>{formatCurrency(total)}</strong>.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={closeCheckout}>Cancel</Button>
          <Button variant="contained" onClick={placeDemoOrder}>
            Place demo order
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
