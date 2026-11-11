export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'customer'
  createdAt: string
}

export interface UserQuery {
  page: number
  perPage: number
  search: string
}

export interface UserPageResult {
  items: User[]
  total: number
  page: number
  perPage: number
  totalPages: number
}
