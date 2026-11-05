/**
 * productsService
 *
 * The products feature talks to the backend ONLY through this module. Pages
 * and components never import apiClient or the seed data directly.
 *
 * VITE_USE_MOCK=true  (default) → in-memory store seeded from demo data.
 * VITE_USE_MOCK=false           → Laravel endpoints:
 *     GET    /products?page=&per_page=&search=&category=&sort=
 *     GET    /products/{id}
 *     GET    /products/featured?limit=
 *     POST   /products
 *     PUT    /products/{id}
 *     DELETE /products/{id}
 * Product JSON is snake_case (compare_at_price, review_count, created_at…);
 * mapProduct/toPayload above convert it. Only this file needs to change if
 * the real API contract differs.
 */

import { apiClient } from '@/shared/lib/apiClient'
import { env } from '@/shared/config/env'
import type { PaginatedResponse } from '@/shared/types/api.types'
import type {
  Product,
  ProductInput,
  ProductPageResult,
  ProductQuery,
} from '../types/product.types'
import { SEED_PRODUCTS } from '../data/seedProducts'

// ─── Backend mapping (Laravel snake_case ↔ frontend camelCase) ───────────────
interface ProductDto {
  id: number
  name: string
  description: string
  price: number | string
  compare_at_price?: number | string | null
  category: Product['category']
  image: string
  availability?: string | null
  rating: number | string
  review_count: number
  stock: number
  featured: boolean | number
  created_at: string
}

function mapProduct(d: ProductDto): Product {
  const p: Product = {
    id: d.id,
    name: d.name,
    description: d.description,
    price: Number(d.price),
    category: d.category,
    image: d.image,
    rating: Number(d.rating),
    reviewCount: d.review_count,
    stock: d.stock,
    featured: Boolean(d.featured),
    createdAt: d.created_at,
  }
  if (d.compare_at_price != null) p.compareAtPrice = Number(d.compare_at_price)
  if (d.availability) p.availability = d.availability
  return p
}

function toPayload(input: ProductInput) {
  return {
    name: input.name,
    description: input.description,
    price: input.price,
    compare_at_price: input.compareAtPrice ?? null,
    category: input.category,
    image: input.image,
    rating: input.rating,
    review_count: input.reviewCount,
    stock: input.stock,
    featured: input.featured,
  }
}

// ─── In-memory store ──────────────────────────────────────────────────────────
// A private copy so callers can't mutate the seed array by reference.
let store: Product[] = SEED_PRODUCTS.map((p) => ({ ...p }))
let nextId = store.reduce((max, p) => Math.max(max, p.id), 0) + 1

/** Simulated network latency so loading/empty states are observable. */
function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

function matchesSearch(product: Product, term: string): boolean {
  const q = term.trim().toLowerCase()
  if (!q) return true
  return (
    product.name.toLowerCase().includes(q) ||
    product.description.toLowerCase().includes(q) ||
    product.category.toLowerCase().includes(q)
  )
}

function sortItems(items: Product[], query: ProductQuery): Product[] {
  const sorted = [...items]
  switch (query.filters.sort) {
    case 'price-asc':
      sorted.sort((a, b) => a.price - b.price)
      break
    case 'price-desc':
      sorted.sort((a, b) => b.price - a.price)
      break
    case 'rating':
      sorted.sort((a, b) => b.rating - a.rating)
      break
    case 'name':
      sorted.sort((a, b) => a.name.localeCompare(b.name))
      break
    case 'featured':
    default:
      // Featured first, then newest.
      sorted.sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1
        return b.createdAt.localeCompare(a.createdAt)
      })
  }
  return sorted
}

// ─── Public API ───────────────────────────────────────────────────────────────

async function list(query: ProductQuery): Promise<ProductPageResult> {
  if (!env.useMock) {
    const { search, category, sort } = query.filters
    const res = await apiClient.get<PaginatedResponse<ProductDto>>('/products', {
      params: {
        page: query.page,
        per_page: query.perPage,
        search: search || undefined,
        category: category === 'All' ? undefined : category,
        sort,
      },
    })
    return {
      items: res.data.map(mapProduct),
      total: res.meta.total,
      page: res.meta.current_page,
      perPage: res.meta.per_page,
      totalPages: Math.max(1, res.meta.last_page),
    }
  }

  const { search, category } = query.filters

  let items = store.filter((p) => matchesSearch(p, search))
  if (category !== 'All') {
    items = items.filter((p) => p.category === category)
  }
  items = sortItems(items, query)

  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / query.perPage))
  const page = Math.min(Math.max(query.page, 1), totalPages)
  const start = (page - 1) * query.perPage
  const pageItems = items.slice(start, start + query.perPage)

  return delay({
    items: pageItems,
    total,
    page,
    perPage: query.perPage,
    totalPages,
  })
}

async function getById(id: number): Promise<Product | null> {
  if (!env.useMock) {
    try {
      const res = await apiClient.get<{ data: ProductDto } | ProductDto>(`/products/${id}`)
      return mapProduct('data' in res ? res.data : res)
    } catch (e) {
      if ((e as { status?: number }).status === 404) return null
      throw e
    }
  }

  const product = store.find((p) => p.id === id) ?? null
  return delay(product)
}

async function getFeatured(limit = 4): Promise<Product[]> {
  if (!env.useMock) {
    const res = await apiClient.get<{ data: ProductDto[] }>('/products/featured', {
      params: { limit },
    })
    return res.data.map(mapProduct)
  }

  const featured = store.filter((p) => p.featured)
  return delay(featured.slice(0, limit))
}

async function create(input: ProductInput): Promise<Product> {
  if (!env.useMock) {
    const res = await apiClient.post<{ data: ProductDto }>('/products', toPayload(input))
    return mapProduct(res.data)
  }

  const product: Product = {
    id: nextId++,
    createdAt: new Date().toISOString().slice(0, 10),
    availability:
      input.stock > 10 ? 'In stock' : input.stock > 0 ? 'Low stock' : 'Out of stock',
    ...input,
  }
  store = [product, ...store]
  return delay(product, 250)
}

async function update(id: number, input: ProductInput): Promise<Product> {
  if (!env.useMock) {
    const res = await apiClient.put<{ data: ProductDto }>(`/products/${id}`, toPayload(input))
    return mapProduct(res.data)
  }

  let updated: Product | null = null
  store = store.map((p) => {
    if (p.id === id) {
      updated = {
        ...p,
        ...input,
        availability:
          input.stock > 10 ? 'In stock' : input.stock > 0 ? 'Low stock' : 'Out of stock',
      }
      return updated
    }
    return p
  })
  if (!updated) throw new Error('Product not found.')
  return delay(updated, 250)
}

async function remove(id: number): Promise<void> {
  if (!env.useMock) {
    await apiClient.delete<void>(`/products/${id}`)
    return
  }

  store = store.filter((p) => p.id !== id)
  return delay(undefined, 250)
}

export const productsService = {
  list,
  getById,
  getFeatured,
  create,
  update,
  remove,
} as const
