import { useAuth } from '@/features/auth'

/**
 * Convenience hook that derives role flags from the authenticated user.
 * Always safe to call — returns false for both flags when not logged in.
 */
export function useRole() {
  const { user } = useAuth()
  return {
    isAdmin: user?.role === 'admin',
    isCustomer: user?.role === 'customer',
    role: user?.role ?? null,
  }
}
