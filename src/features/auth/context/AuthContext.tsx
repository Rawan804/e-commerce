import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import type { AuthState, AuthUser } from '../types/auth.types'
import { authService } from '../services/authService'

// ─── Context shape ────────────────────────────────────────────────────────────
interface AuthContextValue extends AuthState {
  login: (user: AuthUser, token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Token storage ────────────────────────────────────────────────────────────
// Token is persisted in localStorage so auth survives page refresh.
// The user object is NOT cached — we always re-fetch /users/me on startup so
// the user data and role are always fresh from the server.
const TOKEN_KEY = 'auth_token'

function readStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

function persistToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

function clearStoredAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
}

// ─── Provider ────────────────────────────────────────────────────────────────
interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(() => {
    const token = readStoredToken()
    return {
      user: null,
      token,
      isAuthenticated: false,
      // Keep isLoading true when we have a token to validate — the app should
      // wait for /users/me before rendering protected routes.
      isLoading: Boolean(token),
    }
  })

  // On mount: if we have a stored token, validate it by fetching /users/me.
  // This ensures the user object and role always come from the real backend,
  // never from stale cached data.
  useEffect(() => {
    const handleExpired = () => {
      clearStoredAuth()
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
    const handleTokenRefreshed = (event: Event) => {
      const token = (event as CustomEvent<string>).detail
      if (token) setState((current) => ({ ...current, token }))
    }

    window.addEventListener('auth:expired', handleExpired)
    window.addEventListener('auth:token-refreshed', handleTokenRefreshed)

    const token = readStoredToken()
    if (!token) {
      return () => {
        window.removeEventListener('auth:expired', handleExpired)
        window.removeEventListener('auth:token-refreshed', handleTokenRefreshed)
      }
    }

    let cancelled = false

    authService
      .fetchMe()
      .then((user) => {
        if (cancelled) return
        setState({
          user,
          token: readStoredToken() ?? token,
          isAuthenticated: true,
          isLoading: false,
        })
      })
      .catch(() => {
        // Token is expired or invalid — clear it and treat as unauthenticated.
        if (cancelled) return
        clearStoredAuth()
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })
      })

    return () => {
      cancelled = true
      window.removeEventListener('auth:expired', handleExpired)
      window.removeEventListener('auth:token-refreshed', handleTokenRefreshed)
    }
  }, [])

  const login = useCallback((user: AuthUser, token: string) => {
    persistToken(token)
    setState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    })
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    clearStoredAuth()
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuthContext must be used inside <AuthProvider>')
  }
  return ctx
}
