import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
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
import SaveOutlined from '@mui/icons-material/SaveOutlined'
import EditOutlined from '@mui/icons-material/EditOutlined'
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined'
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

  // Per-row inline edit state: productId → draft stock value
  const [editing, setEditing] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState<Record<number, boolean>>({})
  const [toast, setToast] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await productsService.list({
        page: 1,
        perPage: 1000,
        filters: { search: '', category: 'All', sort: 'name' },
      })
      setAllProducts(res.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load inventory.')
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

  const lowStockCount = allProducts.filter((p) => p.stock <= 10).length

  function startEdit(product: Product) {
    setEditing((prev) => ({ ...prev, [product.id]: String(product.stock) }))
  }

  async function saveStock(product: Product) {
    const raw = editing[product.id]
    const newStock = parseInt(raw ?? '', 10)
    if (isNaN(newStock) || newStock < 0) {
      setToast({ msg: 'Stock must be a non-negative number.', severity: 'error' })
      return
    }
    if (newStock === product.stock) {
      setEditing((prev) => { const n = { ...prev }; delete n[product.id]; return n })
      return
    }
    setSaving((prev) => ({ ...prev, [product.id]: true }))
    try {
      const updated = await productsService.update(product.id, {
        name: product.name,
        description: product.description,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        category: product.category,
        image: product.image,
        rating: product.rating,
        reviewCount: product.reviewCount,
        stock: newStock,
        featured: product.featured,
      })
      setAllProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      setEditing((prev) => { const n = { ...prev }; delete n[product.id]; return n })
      setToast({ msg: `Stock updated for "${product.name}".`, severity: 'success' })
    } catch (e) {
      setToast({ msg: e instanceof Error ? e.message : 'Failed to update stock.', severity: 'error' })
    } finally {
      setSaving((prev) => { const n = { ...prev }; delete n[product.id]; return n })
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
        Inventory
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Edit stock levels inline. Changes are saved immediately.
      </Typography>

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
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((product) => {
                const isEditing = product.id in editing
                const isSaving = saving[product.id] ?? false
                const stockValue = editing[product.id] ?? String(product.stock)

                return (
                  <TableRow
                    key={product.id}
                    hover
                    sx={product.stock === 0 ? { bgcolor: 'error.50' } : product.stock <= 10 ? { bgcolor: 'warning.50' } : {}}
                  >
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }} noWrap>
                        {product.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={product.category} size="small" sx={{ bgcolor: 'action.hover' }} />
                    </TableCell>
                    <TableCell>{formatCurrency(product.price)}</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          size="small"
                          type="number"
                          value={stockValue}
                          onChange={(e) =>
                            setEditing((prev) => ({ ...prev, [product.id]: e.target.value }))
                          }
                          slotProps={{ htmlInput: { min: 0, step: 1, style: { width: 80 } } }}
                          disabled={isSaving}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void saveStock(product)
                            if (e.key === 'Escape') setEditing((prev) => { const n = { ...prev }; delete n[product.id]; return n })
                          }}
                        />
                      ) : (
                        <Typography sx={{ fontWeight: 600 }}>{product.stock}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={product.stock === 0 ? 'Out of stock' : product.stock <= 10 ? 'Low stock' : 'In stock'}
                        size="small"
                        color={product.stock === 0 ? 'error' : product.stock <= 10 ? 'warning' : 'success'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        {isEditing ? (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<SaveOutlined />}
                            disabled={isSaving}
                            onClick={() => void saveStock(product)}
                          >
                            {isSaving ? 'Saving…' : 'Save'}
                          </Button>
                        ) : (
                          <IconButton size="small" aria-label={`Edit stock for ${product.name}`} onClick={() => startEdit(product)}>
                            <EditOutlined fontSize="small" />
                          </IconButton>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Box>
      )}

      <Snackbar open={Boolean(toast)} autoHideDuration={3500} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {toast ? <Alert severity={toast.severity} variant="filled" onClose={() => setToast(null)}>{toast.msg}</Alert> : undefined}
      </Snackbar>
    </Container>
  )
}
