import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { useRole } from '@/shared/hooks/useRole'
import { PATHS } from '@/shared/config/paths'

export default function AdminRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const { isAdmin } = useRole()
  const location = useLocation()

  if (isLoading) return null

  if (!isAuthenticated) {
    return <Navigate to={PATHS.login} state={{ from: location }} replace />
  }

  if (!isAdmin) {
    return <Navigate to={PATHS.home} replace />
  }

  return <Outlet />
}
