import { useAuth } from '@/features/auth'

export function useRole() {
  const { user } = useAuth()
  return {
    isAdmin: user?.role === 'admin',
    isCustomer: user?.role === 'customer',
    role: user?.role ?? null,
  }
}
