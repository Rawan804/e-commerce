import { Box, CircularProgress, Container, Paper } from '@mui/material'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { useRole } from '@/shared/hooks/useRole'
import { PATHS } from '@/shared/config/paths'

// Centered card layout for Login and Register pages.
export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth()
  const { isAdmin } = useRole()

  if (isLoading) {
    return <Box sx={{ display: 'grid', minHeight: '100vh', placeItems: 'center' }}><CircularProgress /></Box>
  }
  if (isAuthenticated) {
    return <Navigate to={isAdmin ? PATHS.admin : PATHS.account} replace />
  }

  return (
    <Box
      component="main"
      id="main-content"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          variant="outlined"
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 1.5,
            bgcolor: 'background.paper',
            borderColor: 'divider',
          }}
        >
          <Outlet />
        </Paper>
      </Container>
    </Box>
  )
}
