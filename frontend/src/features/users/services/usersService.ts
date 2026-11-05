/**
 * usersService — the only way the users feature talks to data.
 *
 * VITE_USE_MOCK=true  → in-memory demo data.
 * VITE_USE_MOCK=false → real Laravel endpoints:
 *     GET    /users?page=&per_page=&search=
 *     DELETE /users/{id}
 * Expected user JSON: { id, name, email, avatar?, role, created_at }
 */
import { apiClient } from '@/shared/lib/apiClient'
import { env } from '@/shared/config/env'
import type { PaginatedResponse } from '@/shared/types/api.types'
import type { User, UserPageResult, UserQuery } from '../types/user.types'

// ─── Mapping (backend snake_case → frontend camelCase) ───────────────────────
interface UserDto {
  id: number
  name: string
  email: string
  avatar?: string | null
  role?: 'admin' | 'customer'
  created_at: string
}

function mapUser(dto: UserDto): User {
  const user: User = {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    role: dto.role ?? 'customer',
    createdAt: dto.created_at,
  }
  if (dto.avatar) user.avatar = dto.avatar
  return user
}

// ─── Mock store ───────────────────────────────────────────────────────────────
const px = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop`

let store: User[] = [
  { id: 1, name: 'Lina Haddad', email: 'lina@example.com', avatar: px(774909), role: 'admin', createdAt: '2025-01-12' },
  { id: 2, name: 'Omar Khalil', email: 'omar@example.com', avatar: px(220453), role: 'customer', createdAt: '2025-02-03' },
  { id: 3, name: 'Sara Nasser', email: 'sara@example.com', avatar: px(415829), role: 'customer', createdAt: '2025-02-21' },
  { id: 4, name: 'Yousef Aziz', email: 'yousef@example.com', avatar: px(614810), role: 'customer', createdAt: '2025-03-08' },
  { id: 5, name: 'Maya Saleh', email: 'maya@example.com', avatar: px(1239291), role: 'customer', createdAt: '2025-03-30' },
  { id: 6, name: 'Hana Darwish', email: 'hana@example.com', avatar: px(733872), role: 'customer', createdAt: '2025-04-14' },
  { id: 7, name: 'Karim Mansour', email: 'karim@example.com', role: 'customer', createdAt: '2025-05-02' },
]
let nextId = 8

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

/** Used by authService (mock mode) so newly registered users show up in the list. */
export function addMockUser(name: string, email: string): User {
  const existing = store.find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (existing) return existing
  // id 1 is the seeded admin; new registrations are always customers
  const user: User = {
    id: nextId++,
    name,
    email,
    role: 'customer',
    createdAt: new Date().toISOString().slice(0, 10),
  }
  store = [user, ...store]
  return user
}

// ─── Public API ───────────────────────────────────────────────────────────────
async function list(query: UserQuery): Promise<UserPageResult> {
  if (!env.useMock) {
    const res = await apiClient.get<PaginatedResponse<UserDto>>('/users', {
      params: { page: query.page, per_page: query.perPage, search: query.search || undefined },
    })
    return {
      items: res.data.map(mapUser),
      total: res.meta.total,
      page: res.meta.current_page,
      perPage: res.meta.per_page,
      totalPages: Math.max(1, res.meta.last_page),
    }
  }

  const q = query.search.trim().toLowerCase()
  const filtered = q
    ? store.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    : store
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / query.perPage))
  const page = Math.min(Math.max(query.page, 1), totalPages)
  const start = (page - 1) * query.perPage
  return delay({
    items: filtered.slice(start, start + query.perPage),
    total,
    page,
    perPage: query.perPage,
    totalPages,
  })
}

async function remove(id: number): Promise<void> {
  if (!env.useMock) {
    await apiClient.delete<void>(`/users/${id}`)
    return
  }
  store = store.filter((u) => u.id !== id)
  return delay(undefined, 250)
}

async function updateRole(id: number, role: 'admin' | 'customer'): Promise<User> {
  if (!env.useMock) {
    return apiClient.patch<User>(`/users/${id}/role`, { role })
  }
  const idx = store.findIndex((u) => u.id === id)
  if (idx === -1) throw new Error('User not found.')
  store = store.map((u, i) => (i === idx ? { ...u, role } : u))
  return delay(store.find((u) => u.id === id)!, 250)
}

/** Update name/email for a user (used by customer profile page). */
async function updateProfile(
  id: number,
  data: { name: string; email: string },
): Promise<User> {
  if (!env.useMock) {
    return apiClient.put<User>(`/users/${id}`, data)
  }
  const idx = store.findIndex((u) => u.id === id)
  if (idx === -1) throw new Error('User not found.')
  store = store.map((u, i) => (i === idx ? { ...u, ...data } : u))
  return delay(store.find((u) => u.id === id)!, 350)
}

export const usersService = { list, remove, updateRole, updateProfile } as const
