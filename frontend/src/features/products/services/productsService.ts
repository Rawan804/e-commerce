import { apiClient } from '@/shared/lib/apiClient'
import type { PaginatedResponse } from '@/shared/types/api.types'
import type {
  Product,
  ProductInput,
  ProductPageResult,
  ProductQuery,
  ProductSortKey,
} from '../types/product.types'

// Backend DTO
interface ProductDto {
  id: number
  name: string
  description: string | null
  price: string | number
  category: string
  image_url: string | null
  stock_quantity: number | null
  created_at: string | null
  updated_at?: string | null
}

interface ProductDtoEnvelope {
  data: ProductDto
}

// Convert frontend sort values to Laravel accepted values
function toApiSort(sort: ProductSortKey): string | undefined {
  switch (sort) {
    case 'price-asc':
      return 'price'

    case 'price-desc':
      return '-price'

    case 'name':
      return 'name'

    case 'featured':
    default:
      // Laravel does not accept "featured".
      // Its default sorting is -created_at.
      return undefined
  }
}

// Convert Laravel ProductResource to frontend Product
function mapProduct(d: ProductDto): Product {
  const stock = d.stock_quantity

  return {
    id: d.id,
    name: d.name,
    description: d.description ?? '',
    price: Number(d.price),
    category: d.category,
    image: d.image_url ?? '',
    stock,

    ...(stock !== null
      ? {
        availability:
          stock === 0
            ? 'Out of stock'
            : stock <= 5
              ? 'Low stock'
              : 'In stock',
      }
      : {}),

    createdAt: d.created_at ?? new Date().toISOString(),
  }
}

// Prepare request payload
function toPayload(input: ProductInput) {
  return {
    name: input.name,
    description: input.description,
    price: input.price,
    category: input.category,
  }
}

// Get paginated products
async function list(query: ProductQuery): Promise<ProductPageResult> {
  const { search, category, sort } = query.filters

  const apiSort = toApiSort(sort)

  const res = await apiClient.get<PaginatedResponse<ProductDto>>(
    '/products',
    {
      params: {
        page: query.page,
        per_page: query.perPage,

        ...(search.trim()
          ? { q: search.trim() }
          : {}),

        ...(category && category !== 'All'
          ? { category }
          : {}),

        ...(apiSort
          ? { sort: apiSort }
          : {}),
      },
    }
  )

  return {
    items: res.data.map(mapProduct),
    total: res.meta.total,
    page: res.meta.current_page,
    perPage: res.meta.per_page,
    totalPages: Math.max(1, res.meta.last_page),
  }
}

// Get one product
async function getById(id: number): Promise<Product | null> {
  try {
    const res = await apiClient.get<ProductDtoEnvelope>(
      `/products/${id}`
    )

    return mapProduct(res.data)
  } catch (error) {
    const status = (error as { status?: number }).status

    if (status === 404) {
      return null
    }

    throw error
  }
}

// Get featured products
async function getFeatured(limit = 4): Promise<Product[]> {
  const res = await apiClient.get<{ data: ProductDto[] }>(
    '/products/featured',
    {
      params: { limit },
    }
  )

  return res.data.map(mapProduct)
}

// Create product
async function create(input: ProductInput): Promise<Product> {
  const payload = toPayload(input)
  const createPayload = { ...payload, initial_stock: Number(input.initialStock) }
  const body = input.image
    ? productFormData(payload, input.image, Number(input.initialStock))
    : createPayload
  const res = await apiClient.post<ProductDtoEnvelope>('/products', body)

  return mapProduct(res.data)
}

// Update product
async function update(
  id: number,
  input: ProductInput
): Promise<Product> {
  const res = await apiClient.put<ProductDtoEnvelope>(
    `/products/${id}`,
    toPayload(input)
  )

  return input.image ? uploadImage(id, input.image) : mapProduct(res.data)
}

function productFormData(
  payload: ReturnType<typeof toPayload>,
  image: File,
  initialStock?: number,
): FormData {
  const formData = new FormData()
  formData.append('name', payload.name)
  formData.append('description', payload.description)
  formData.append('price', String(payload.price))
  formData.append('category', payload.category)
  if (initialStock !== undefined) formData.append('initial_stock', String(initialStock))
  formData.append('image', image)
  return formData
}

async function uploadImage(id: number, image: File): Promise<Product> {
  const formData = new FormData()
  formData.append('image', image)
  const res = await apiClient.post<ProductDtoEnvelope>(`/products/${id}/image`, formData)
  return mapProduct(res.data)
}

// Update stock quantity via the admin endpoint
async function setStock(id: number, quantity: number): Promise<number> {
  const res = await apiClient.put<{ data: { product_id: number; stock_quantity: number } }>(
    `/products/${String(id)}/stock`,
    { quantity },
  )

  return res.data.stock_quantity
}

// Delete product
async function remove(id: number): Promise<void> {
  await apiClient.delete<void>(`/products/${id}`)
}

export const productsService = {
  list,
  getById,
  getFeatured,
  create,
  update,
  setStock,
  remove,
} as const