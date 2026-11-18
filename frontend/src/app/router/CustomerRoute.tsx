import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { useRole } from '@/shared/hooks/useRole'
import { PATHS } from '@/shared/config/paths'

/**
 * Guards routes that require authentication (customer area, checkout).
 * Admins are also permitted — they can still use the storefront.
 * - Not authenticated → redirect to /login (preserves destination in state)
 * - Authenticated (any role) → render <Outlet />
 */
export default function CustomerRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const { isAdmin } = useRole()
  const location = useLocation()

  if (isLoading) return null

  if (!isAuthenticated) {
    return <Navigate to={PATHS.login} state={{ from: location }} replace />
  }

  if (isAdmin) return <Navigate to={PATHS.admin} replace />

  return <Outlet />
}
