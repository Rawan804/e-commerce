import { apiClient } from '@/shared/lib/apiClient'
import type { PaginatedResponse } from '@/shared/types/api.types'
import type { User, UserPageResult, UserQuery } from '../types/user.types'

interface UserDto {
    id: number
    name: string
    email: string
    role: 'admin' | 'customer'
    created_at: string
}

function mapUser(dto: UserDto): User {
    return {
        id: dto.id,
        name: dto.name,
        email: dto.email,
        role: dto.role,
        createdAt: dto.created_at,
    }
}

async function list(query: UserQuery): Promise<UserPageResult> {
    const res = await apiClient.get<PaginatedResponse<UserDto>>('/users', {
        params: {
            page: query.page,
            per_page: query.perPage,
            search: query.search || undefined,
        },
    })

    return {
        items: res.data.map(mapUser),
        total: res.meta.total,
        page: res.meta.current_page,
        perPage: res.meta.per_page,
        totalPages: Math.max(1, res.meta.last_page),
    }
}

async function remove(id: number): Promise<void> {
    await apiClient.delete<void>(`/users/${id}`)
}

async function updateRole(id: number, role: User['role']): Promise<User> {
    const res = await apiClient.patch<{ data: UserDto }>(`/users/${id}/role`, { role })
    return mapUser(res.data)
}

async function updateProfile(data: { name: string; email: string }): Promise<User> {
    const res = await apiClient.patch<{ data: UserDto }>('/users/me', data)
    return mapUser(res.data)
}

export const usersService = { list, remove, updateRole, updateProfile } as const