// ─── Product domain types ────────────────────────────────────────────────────
// Shapes used by the products feature. Field names align with what a typical
// Laravel product resource returns; verify against the real API contract when
// the backend is available and adjust here only.

export interface Product {
  id: number
  name: string
  description: string
  /** Price in major currency units (e.g. dollars), not cents. */
  price: number
  /** Compare-at price for showing a discount strike-through. Optional. */
  compareAtPrice?: number
  category: ProductCategory
  /** Absolute image URL (Pexels CDN for demo data, or a backend URL). */
  image: string
  /** Short label shown under the price, e.g. "In stock" / "Low stock". */
  availability?: string
  rating: number
  reviewCount: number
  stock: number
  featured: boolean
  createdAt: string
}

export type ProductCategory =
  'Stationery' | 'Audio' | 'Wearables' | 'Photography' | 'Computing' | 'Home & Kitchen'

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'Stationery',
  'Audio',
  'Wearables',
  'Photography',
  'Computing',
  'Home & Kitchen',
]

// ─── Filters & queries ───────────────────────────────────────────────────────

export type ProductSortKey = 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'name'

export interface ProductFilters {
  search: string
  category: ProductCategory | 'All'
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

export interface ProductInput {
  name: string
  description: string
  price: number
  compareAtPrice?: number
  category: ProductCategory
  image: string
  rating: number
  reviewCount: number
  stock: number
  featured: boolean
}

export type ProductInputErrors = Partial<Record<keyof ProductInput, string>>
