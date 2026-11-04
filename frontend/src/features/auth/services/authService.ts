import { apiClient } from '@/shared/lib/apiClient'
import { env } from '@/shared/config/env'
import { addMockUser } from '@/features/users/services/usersService'
import type {
  AuthTokenResponse,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from '../types/auth.types'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

function demoToken(): string {
  return 'demo.' + Math.random().toString(36).slice(2) + '.' + Date.now().toString(36)
}

function toAuthUser(u: { id: number; name: string; email: string; role?: 'admin' | 'customer' }): AuthUser {
  return { id: u.id, name: u.name, email: u.email, role: u.role ?? 'customer' }
}

async function login(payload: LoginPayload): Promise<AuthTokenResponse> {
  if (!env.useMock) {
    return apiClient.post<AuthTokenResponse>('/auth/login', payload)
  }
  await wait(500)
  const base = payload.email.split('@')[0] ?? 'Shopper'
  const name = base.charAt(0).toUpperCase() + base.slice(1)
  return {
    token: demoToken(),
    token_type: 'Bearer',
    user: toAuthUser(addMockUser(name, payload.email)),
  }
}

async function register(payload: RegisterPayload): Promise<AuthTokenResponse> {
  if (!env.useMock) {
    return apiClient.post<AuthTokenResponse>('/auth/register', {
      name: payload.username,
      email: payload.email,
      password: payload.password,
      password_confirmation: payload.password_confirmation,
    })
  }
  await wait(600)
  return {
    token: demoToken(),
    token_type: 'Bearer',
    user: toAuthUser(addMockUser(payload.username, payload.email)),
  }
}

async function logout(): Promise<void> {
  if (env.useMock) return
  try {
    await apiClient.post('/auth/logout')
  } catch {
  }
}

export const authService = { login, register, logout } as const
