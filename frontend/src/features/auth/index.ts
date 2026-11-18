// Public API for the auth feature.
// Other features and app/ code import from here only — never from internals.
export { AuthProvider } from './context/AuthContext'
export { useAuth } from './hooks/useAuth'
export type { AuthUser, AuthState } from './types/auth.types'
