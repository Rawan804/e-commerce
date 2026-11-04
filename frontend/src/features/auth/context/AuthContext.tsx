import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { AuthState, AuthUser } from '../types/auth.types'
interface AuthContextValue extends AuthState {
  login: (user: AuthUser, token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)
const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

function readStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

function persistToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

function persistUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

function clearStoredAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(() => {
    const token = readStoredToken()
    const user = readStoredUser()
    return {
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading: false,
    }
  })

  const login = useCallback((user: AuthUser, token: string) => {
    persistToken(token)
    persistUser(user)
    setState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    })
  }, [])

  const logout = useCallback(() => {
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


export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuthContext must be used inside <AuthProvider>')
  }
  return ctx
}
