import { useState } from 'react'
import {
  AppBar,
  Badge,
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material'
import MenuOutlined from '@mui/icons-material/MenuOutlined'
import ShoppingCartOutlined from '@mui/icons-material/ShoppingCartOutlined'
import AccountCircleOutlined from '@mui/icons-material/AccountCircleOutlined'
import HomeOutlined from '@mui/icons-material/HomeOutlined'
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined'
import DashboardOutlined from '@mui/icons-material/DashboardOutlined'
import InventoryOutlined from '@mui/icons-material/InventoryOutlined'
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined'
import PeopleOutlineOutlined from '@mui/icons-material/PeopleOutlineOutlined'
import PersonOutlined from '@mui/icons-material/PersonOutlined'
import LogoutOutlined from '@mui/icons-material/LogoutOutlined'
import { NavLink, Link } from 'react-router-dom'
import { NAV_ITEMS, ADMIN_NAV_ITEMS, CUSTOMER_NAV_ITEMS } from '@/shared/config/navigation'
import { PATHS } from '@/shared/config/paths'
import { useAuth } from '@/features/auth'
import { useRole } from '@/shared/hooks/useRole'
import { useCart } from '@/features/cart'
import MobileNavDrawer from './MobileNavDrawer'

/**
 * Desktop sidebar with a compact mobile header and drawer.
 * Nav items are filtered by role so admins and customers see different sections.
 */
export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { isAuthenticated, logout } = useAuth()
  const { isAdmin } = useRole()
  const { count, openCart } = useCart()

  // Build the correct nav list based on role
  const visibleItems = isAdmin
    ? ADMIN_NAV_ITEMS
    : [
      ...NAV_ITEMS,
      ...(isAuthenticated ? CUSTOMER_NAV_ITEMS : []),
    ]

  const openDrawer = () => setDrawerOpen(true)
  const closeDrawer = () => setDrawerOpen(false)

  const NavIcon = ({ path }: { path: string }) => {
    if (path === PATHS.home) return <HomeOutlined />
    if (path === PATHS.products) return <StorefrontOutlined />
    if (path === PATHS.admin) return <DashboardOutlined />
    if (path === PATHS.adminProducts) return <StorefrontOutlined />
    if (path === PATHS.adminInventory) return <InventoryOutlined />
    if (path === PATHS.adminOrders) return <ReceiptLongOutlined />
    if (path === PATHS.adminUsers) return <PeopleOutlineOutlined />
    if (path === PATHS.account || path === PATHS.accountProfile) return <PersonOutlined />
    if (path === PATHS.accountOrders) return <ReceiptLongOutlined />
    return <PeopleOutlineOutlined />
  }

  return (
    <>
      <AppBar
        component="header"
        position="sticky"
        elevation={0}
        sx={{
          display: { xs: 'block', md: 'none' },
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Toolbar sx={{ minHeight: 64, justifyContent: 'space-between', gap: 1 }}>
          <IconButton
            onClick={openDrawer}
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
            aria-controls="mobile-nav-drawer"
            color="inherit"
          >
            <MenuOutlined />
          </IconButton>
          <Typography
            variant="h6"
            component={Link}
            to={isAdmin ? PATHS.admin : PATHS.home}
            sx={{ color: 'text.primary', textDecoration: 'none', flex: 1 }}
          >
            {isAdmin ? 'ShopFront Admin' : 'ShopFront'}
          </Typography>
          {!isAdmin && (
            <IconButton
              aria-label={`Shopping cart, ${count} item${count === 1 ? '' : 's'}`}
              onClick={openCart}
              color="inherit"
            >
              <Badge badgeContent={count} color="secondary">
                <ShoppingCartOutlined />
              </Badge>
            </IconButton>
          )}
          {isAuthenticated ? (
            <IconButton aria-label="Log out" onClick={logout} color="inherit">
              <LogoutOutlined />
            </IconButton>
          ) : (
            <IconButton
              component={Link}
              to={PATHS.login}
              aria-label="Sign in"
              color="inherit"
            >
              <AccountCircleOutlined />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      <Box
        component="aside"
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          width: 256,
          position: 'fixed',
          inset: '0 auto 0 0',
          zIndex: (theme) => theme.zIndex.drawer,
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          py: 3,
        }}
      >
        <Typography
          component={Link}
          to={isAdmin ? PATHS.admin : PATHS.home}
          variant="h5"
          sx={{ px: 3, mb: 4, color: 'text.primary', textDecoration: 'none' }}
        >
          {isAdmin ? 'ShopFront Admin' : 'ShopFront'}
        </Typography>
        <Box component="nav" aria-label="Main navigation">
          <List sx={{ px: 1.5, py: 0 }}>
            {visibleItems.map((item) => (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={NavLink}
                  to={item.path}
                  end={item.path === PATHS.admin || item.path === PATHS.account}
                  sx={{
                    minHeight: 44,
                    borderRadius: 2,
                    borderLeft: '3px solid transparent',
                    color: 'text.secondary',
                    transition: 'all 200ms ease',
                    '& .MuiListItemIcon-root': {
                      color: 'inherit',
                      minWidth: 36,
                    },
                    '&.active': {
                      color: '#8965A8',
                      bgcolor: '#F1E8F8',
                      borderLeftColor: '#C4A7D7',
                      '& .MuiListItemText-primary': {
                        fontWeight: 600,
                      },
                    },
                    '&:hover': { bgcolor: '#F8F4FB' },
                    '&.active:hover': { bgcolor: '#EAE0F3' },
                  }}
                >
                  <ListItemIcon>
                    <NavIcon path={item.path} />
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
        <Box sx={{ mt: 'auto', px: 1.5 }}>
          {!isAdmin && (
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ShoppingCartOutlined />}
              onClick={openCart}
              sx={{
                justifyContent: 'flex-start',
                mb: 1,
                borderColor: 'divider',
                color: 'text.primary',
              }}
            >
              Cart{count > 0 ? ` (${count})` : ''}
            </Button>
          )}
          {isAuthenticated ? (
            <Button
              fullWidth
              startIcon={<LogoutOutlined />}
              onClick={logout}
              sx={{ justifyContent: 'flex-start', color: 'text.secondary' }}
            >
              Log out
            </Button>
          ) : (
            <Button
              component={Link}
              to={PATHS.login}
              fullWidth
              startIcon={<AccountCircleOutlined />}
              sx={{ justifyContent: 'flex-start', color: 'text.secondary' }}
            >
              Sign in
            </Button>
          )}
        </Box>
      </Box>

      <MobileNavDrawer open={drawerOpen} onClose={closeDrawer} />
    </>
  )
}
