// ─── Product domain types ────────────────────────────────────────────────────
// Shapes used by the products feature. Field names align with what the
// Laravel product resource returns.

export interface Product {
  id: number
  name: string
  description: string
  /** Price in major currency units (e.g. dollars), not cents. */
  price: number
  /** Category string — open-ended, comes from the backend. */
  category: string
  /** Absolute image URL returned by the backend, or empty string. */
  image: string
  /** Short availability label derived from stock_quantity. */
  availability?: string
  /** Current stock from the Warehouse service, or null when unavailable. */
  stock: number | null
  createdAt: string
}

/** Product categories are backend-provided strings; Laravel has no category endpoint. */
export type ProductCategory = string



// ─── Filters & queries ───────────────────────────────────────────────────────

export type ProductSortKey = 'featured' | 'price-asc' | 'price-desc' | 'name'

export interface ProductFilters {
  search: string
  category: string
  sort: ProductSortKey
}

export const DEFAULT_FILTERS: ProductFilters = {
  search: '',
  category: 'All',
  sort: 'featured',
}

export interface ProductQuery {
  page: number
  perPage: number
  filters: ProductFilters
}

export interface ProductPageResult {
  items: Product[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

// ─── Mutations ────────────────────────────────────────────────────────────────
// Only fields the Laravel backend accepts for create/update.

export interface ProductInput {
  name: string
  description: string
  price: number
  category: string
  initialStock: number | ''
  image?: File | null
}

export type ProductInputErrors = Partial<Record<keyof ProductInput, string>>
