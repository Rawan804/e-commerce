// ─── Generic paginated response ──────────────────────────────────────────────
// Shape mirrors Laravel's default paginator. Verify field names against a real
// response before Phase 4 — never assume.
export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
  links: PaginationLinks
}

export interface PaginationMeta {
  current_page: number
  from: number | null
  last_page: number
  per_page: number
  to: number | null
  total: number
  path: string
}

export interface PaginationLinks {
  first: string | null
  last: string | null
  prev: string | null
  next: string | null
}

// ─── Normalized API error ─────────────────────────────────────────────────────
// Covers: network errors, 4xx/5xx, and Laravel 422 validation errors.
export interface ApiError {
  message: string
  status: number | null   // null = network / pre-response error
  code?: string
  errors?: Record<string, string[]>  // Laravel 422 validation field errors
}
