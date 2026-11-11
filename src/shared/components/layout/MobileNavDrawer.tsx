import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  Divider,
  IconButton,
  Typography,
} from '@mui/material'
import CloseOutlined from '@mui/icons-material/CloseOutlined'
import { NavLink } from 'react-router-dom'
import { NAV_ITEMS, ADMIN_NAV_ITEMS, CUSTOMER_NAV_ITEMS } from '@/shared/config/navigation'
import { PATHS } from '@/shared/config/paths'
import { useAuth } from '@/features/auth'
import { useRole } from '@/shared/hooks/useRole'

interface MobileNavDrawerProps {
  open: boolean
  onClose: () => void
}

export default function MobileNavDrawer({ open, onClose }: MobileNavDrawerProps) {
  const { isAuthenticated } = useAuth()
  const { isAdmin } = useRole()

  const visibleItems = isAdmin
    ? ADMIN_NAV_ITEMS
    : [
      ...NAV_ITEMS,
      ...(isAuthenticated ? CUSTOMER_NAV_ITEMS : []),
    ]

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      slotProps={{
        paper: {
          sx: { width: 256, bgcolor: 'background.paper' },
          component: 'nav',
          'aria-label': 'Mobile navigation',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography
          variant="h6"
          component={NavLink}
          to={isAdmin ? PATHS.admin : PATHS.home}
          onClick={onClose}
          sx={{
            color: 'inherit',
            textDecoration: 'none',
            fontWeight: 700,
            letterSpacing: '-0.3px',
          }}
        >
          {isAdmin ? 'ShopFront Admin' : 'ShopFront'}
        </Typography>
        <IconButton
          onClick={onClose}
          aria-label="Close navigation menu"
          sx={{ color: 'text.secondary' }}
        >
          <CloseOutlined />
        </IconButton>
      </Box>

      <Divider />

      <List sx={{ pt: 1 }}>
        {visibleItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={NavLink}
              to={item.path}
              end={item.path === PATHS.admin || item.path === PATHS.account}
              onClick={onClose}
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: 2,
                mx: 1,
                borderLeft: '3px solid transparent',
                color: 'text.secondary',
                '&.active': {
                  bgcolor: '#F1E8F8',
                  color: '#8965A8',
                  borderLeftColor: '#C4A7D7',
                  '& .MuiListItemText-primary': { fontWeight: 700 },
                },
                '&:hover': { bgcolor: 'action.hover' },
                '&.active:hover': { bgcolor: '#EAE0F3' },
              }}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  )
}
