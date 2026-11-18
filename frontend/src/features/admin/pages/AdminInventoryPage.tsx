/**
 * AdminInventoryPage
 *
 * Displays current stock levels and lets admins update the actual available
 * quantity in the Warehouse service through Laravel's admin endpoint.
 */
import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import { productsService } from '@/features/products/services/productsService'
import type { Product } from '@/features/products/types/product.types'
import { formatCurrency } from '@/shared/lib/formatters'
import ErrorMessage from '@/shared/components/feedback/ErrorMessage'
import ProductSearch from '@/features/products/components/ProductSearch'
import { useDebounce } from '@/shared/hooks/useDebounce'

export default function AdminInventoryPage() {
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 350)

  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [drafts, setDrafts] = useState<Record<number, string>>({})
  const [toast, setToast] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const firstPage = await productsService.list({
        page: 1,
        perPage: 100,
        filters: { search: '', category: 'All', sort: 'name' },
      })
      const remainingPages = await Promise.all(
        Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
          productsService.list({
            page: index + 2,
            perPage: 100,
            filters: { search: '', category: 'All', sort: 'name' },
          }),
        ),
      )
      const nextProducts = [firstPage, ...remainingPages].flatMap((page) => page.items)
      setAllProducts(nextProducts)
      setDrafts((prev) => {
        const next = { ...prev }
        nextProducts.forEach((product) => {
          if (!(product.id in next)) {
            next[product.id] = String(product.stock ?? 0)
          }
        })
        return next
      })
    } catch (e) {
      setError(
        e && typeof e === 'object' && 'message' in e
          ? String((e).message)
          : 'Failed to load inventory.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const filtered = debouncedSearch.trim()
    ? allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(debouncedSearch.toLowerCase()),
    )
    : allProducts

  const lowStockCount = allProducts.filter((p) => p.stock !== null && p.stock <= 10).length

  async function updateStock(product: Product) {
    const rawValue = (drafts[product.id] ?? String(product.stock ?? 0)).trim()

    if (!/^\d+$/.test(rawValue)) {
      setToast({ msg: 'Stock quantity must be a non-negative whole number.', severity: 'error' })
      return
    }

    const quantity = Number(rawValue)
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > 100000) {
      setToast({ msg: 'Stock quantity must be between 0 and 100000.', severity: 'error' })
      return
    }

    if (!window.confirm(`Set stock for "${product.name}" to ${quantity}?`)) {
      return
    }

    setUpdatingId(product.id)
    try {
      await productsService.setStock(product.id, quantity)
      await load()
      setToast({ msg: `Stock for "${product.name}" updated to ${quantity}.`, severity: 'success' })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to update stock.'
      setToast({ msg: message, severity: 'error' })
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
        Inventory
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Stock levels are read from the Warehouse service in real time.
      </Typography>

      <Alert severity="info" icon={<InfoOutlined />} sx={{ mb: 3, borderRadius: 2 }}>
        Admins can update the current stock quantity here. Changes are written to the warehouse service and reflected back through the API.
      </Alert>

      {lowStockCount > 0 && !loading && (
        <Alert
          severity="warning"
          icon={<WarningAmberOutlined />}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          {lowStockCount} product{lowStockCount !== 1 ? 's are' : ' is'} low on stock or out of stock.
        </Alert>
      )}

      <Box sx={{ maxWidth: 360, mb: 2 }}>
        <ProductSearch value={searchInput} onChange={setSearchInput} />
      </Box>

      {error ? (
        <ErrorMessage error={error} onRetry={load} />
      ) : loading ? (
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      ) : (
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Stock</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', color: 'text.secondary', py: 4 }}>
                    No products found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((product) => (
                  <TableRow
                    key={product.id}
                    hover
                    sx={product.stock === 0
                      ? { bgcolor: 'error.50' }
                      : product.stock !== null && product.stock <= 10
                        ? { bgcolor: 'warning.50' }
                        : {}}
                  >
                    <TableCell>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        {product.stock !== null && product.stock <= 10 && (
                          <WarningAmberOutlined
                            fontSize="small"
                            sx={{ color: product.stock === 0 ? 'error.main' : 'warning.main' }}
                          />
                        )}
                        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }} noWrap>
                          {product.name}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip label={product.category} size="small" sx={{ bgcolor: 'action.hover' }} />
                    </TableCell>
                    <TableCell>{formatCurrency(product.price)}</TableCell>
                    <TableCell>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: 'center' }}>
                        <TextField
                          size="small"
                          type="number"
                          value={drafts[product.id] ?? (product.stock ?? '')}
                          onChange={(event) => {
                            setDrafts((prev) => ({ ...prev, [product.id]: event.target.value }))
                          }}
                          slotProps={{ htmlInput: { min: 0, max: 100000, step: 1 } }}
                          sx={{ minWidth: 110 }}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => { void updateStock(product) }}
                          disabled={updatingId === product.id}
                        >
                          {updatingId === product.id ? 'Saving...' : 'Apply'}
                        </Button>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          product.stock === null
                            ? 'Unavailable'
                            : product.stock === 0
                              ? 'Out of stock'
                              : product.stock <= 10
                                ? 'Low stock'
                                : 'In stock'
                        }
                        size="small"
                        color={
                          product.stock === null
                            ? 'default'
                            : product.stock === 0
                              ? 'error'
                              : product.stock <= 10
                                ? 'warning'
                                : 'success'
                        }
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      )}

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3500}
        onClose={() => { setToast(null) }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? (
          <Alert severity={toast.severity} variant="filled" onClose={() => { setToast(null) }}>
            {toast.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Container>
  )
}
