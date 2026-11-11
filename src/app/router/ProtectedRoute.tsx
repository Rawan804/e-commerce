import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { PATHS } from '@/shared/config/paths'

// Guards any route that requires authentication.
// If the user is not logged in, redirects to /login and preserves the
// intended destination in location state so we can redirect back after login.
export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // During Phase 5, isLoading will be true while we verify the token via /me.
  // Showing nothing prevents a flash of the login page on refresh.
  if (isLoading) return null

  if (!isAuthenticated) {
    return (
      <Navigate
        to={PATHS.login}
        state={{ from: location }}
        replace
      />
    )
  }

  return <Outlet />
}
