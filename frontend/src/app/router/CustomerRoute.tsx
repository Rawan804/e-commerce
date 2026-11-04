import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { PATHS } from '@/shared/config/paths'
export default function CustomerRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return null

  if (!isAuthenticated) {
    return <Navigate to={PATHS.login} state={{ from: location }} replace />
  }

  return <Outlet />
}
