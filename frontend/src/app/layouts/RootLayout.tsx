import { Box } from '@mui/material'
import { Outlet } from 'react-router-dom'
import Header from '@/shared/components/layout/Header'
import Footer from '@/shared/components/layout/Footer'
import CartDrawer from '@/features/cart/components/CartDrawer'

// Skip-to-content link: visually hidden until focused — WCAG 2.4.1 (Bypass Blocks).
const skipLinkSx = {
  position: 'absolute',
  top: '-100%',
  left: 0,
  zIndex: 9999,
  p: 2,
  bgcolor: 'primary.main',
  color: 'primary.contrastText',
  fontWeight: 700,
  '&:focus': { top: 0 },
} as const

/**
 * RootLayout wraps every public route.
 * Structure:
 *   skip link → <Header /> → <main> (Outlet) → <Footer />
 *
 * The layout uses a flex column so the footer always sticks to the bottom
 * even on short pages (min-height: 100dvh on the wrapper).
 */
export default function RootLayout() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
      }}
    >
      {/* Keyboard / screen-reader skip link */}
      <Box component="a" href="#main-content" sx={skipLinkSx}>
        Skip to content
      </Box>

      <Header />

      <Box
        component="main"
        id="main-content"
        sx={{ flex: 1, minWidth: 0, ml: { xs: 0, md: '256px' } }}
        // tabIndex={-1} so the skip link target can receive focus
        tabIndex={-1}
      >
        <Outlet />
      </Box>

      <Box sx={{ ml: { xs: 0, md: '256px' } }}>
        <Footer />
      </Box>

      {/* Global shopping cart drawer (controlled by CartContext) */}
      <CartDrawer />
    </Box>
  )
}
