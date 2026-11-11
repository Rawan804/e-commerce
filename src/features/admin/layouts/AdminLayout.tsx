import { Box } from '@mui/material'
import { Outlet } from 'react-router-dom'
import Header from '@/shared/components/layout/Header'
import Footer from '@/shared/components/layout/Footer'

/**
 * AdminLayout
 *
 * Reuses the same Header + Footer as RootLayout.
 * The Header component already renders the admin sidebar when isAdmin is true,
 * so no extra sidebar logic is needed here — this layout just provides the
 * correct structural shell and main content offset.
 *
 * No CartDrawer is rendered for the admin area.
 */

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

export default function AdminLayout() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <Box component="a" href="#main-content" sx={skipLinkSx}>
        Skip to content
      </Box>

      <Header />

      <Box
        component="main"
        id="main-content"
        tabIndex={-1}
        sx={{ flex: 1, minWidth: 0, ml: { xs: 0, md: '256px' } }}
      >
        <Outlet />
      </Box>

      <Box sx={{ ml: { xs: 0, md: '256px' } }}>
        <Footer />
      </Box>
    </Box>
  )
}
