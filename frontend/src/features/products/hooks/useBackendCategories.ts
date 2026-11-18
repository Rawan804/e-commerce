
import { useEffect, useState } from 'react'
import { apiClient } from '@/shared/lib/apiClient'
import type { PaginatedResponse } from '@/shared/types/api.types'

interface ProductDto {
  category: string | null
}

export function useBackendCategories() {
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchCategories() {
      try {
        setLoading(true)
        setError(null)

        const firstPage = await apiClient.get<PaginatedResponse<ProductDto>>(
          '/products',
          {
            params: {
              page: 1,
              per_page: 100,
            },
          }
        )

        const allProducts = [...firstPage.data]

        for (
          let page = 2;
          page <= firstPage.meta.last_page;
          page++
        ) {
          if (cancelled) return

          const response = await apiClient.get<PaginatedResponse<ProductDto>>(
            '/products',
            {
              params: {
                page,
                per_page: 100,
              },
            }
          )

          allProducts.push(...response.data)
        }

        if (cancelled) return

        const uniqueCategories = Array.from(
          new Set(
            allProducts
              .map((product) => product.category?.trim())
              .filter((category): category is string => Boolean(category))
          )
        ).sort((a, b) => a.localeCompare(b))

        setCategories(uniqueCategories)
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load backend categories:', err)
          setCategories([])
          setError('تعذر تحميل التصنيفات من الخادم')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchCategories()

    return () => {
      cancelled = true
    }
  }, [])

  return { categories, loading, error }
}
