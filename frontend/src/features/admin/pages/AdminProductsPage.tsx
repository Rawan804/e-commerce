import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import AddOutlined from '@mui/icons-material/AddOutlined'
import EditOutlined from '@mui/icons-material/EditOutlined'
import DeleteOutline from '@mui/icons-material/DeleteOutlineOutlined'
import { productsService } from '@/features/products/services/productsService'
import {
  DEFAULT_FILTERS,
  type Product,
  type ProductFilters,
  type ProductInput,
  type ProductPageResult,
} from '@/features/products/types/product.types'
import { formatCurrency } from '@/shared/lib/formatters'
import { useDebounce } from '@/shared/hooks/useDebounce'
import ErrorMessage from '@/shared/components/feedback/ErrorMessage'
import EmptyState from '@/shared/components/feedback/EmptyState'
import ProductSearch from '@/features/products/components/ProductSearch'
import ProductFiltersBar from '@/features/products/components/ProductFilters'
import ProductPagination from '@/features/products/components/ProductPagination'
import ProductFormDialog from '@/features/products/components/ProductFormDialog'
import DeleteProductDialog from '@/features/products/components/DeleteProductDialog'
import ProductImage from '@/features/products/components/ProductImage'

const PER_PAGE = 10

export default function AdminProductsPage() {
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 350)
  const [filters, setFilters] = useState<ProductFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)

  const [result, setResult] = useState<ProductPageResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add')
  const [editing, setEditing] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)

  const [deleting, setDeleting] = useState<Product | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [toast, setToast] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null)

  useEffect(() => {
    setFilters((prev) =>
      prev.search === debouncedSearch ? prev : { ...prev, search: debouncedSearch },
    )
  }, [debouncedSearch])

  useEffect(() => { setPage(1) }, [filters.search, filters.category, filters.sort])

  const load = useCallback(async (p = page) => {
    let active = true
    setLoading(true)
    setError(null)
    try {
      const res = await productsService.list({ page: p, perPage: PER_PAGE, filters })
      if (!active) return
      setResult(res)
      if (res.totalPages > 0 && p > res.totalPages) setPage(res.totalPages)
    } catch (e) {
      if (active) setError(e instanceof Error ? e.message : 'Failed to load products.')
    } finally {
      if (active) setLoading(false)
    }
    return () => { active = false }
  }, [page, filters])

  useEffect(() => { void load() }, [load])

  function openAdd() { setFormMode('add'); setEditing(null); setFormOpen(true) }
  function openEdit(p: Product) { setFormMode('edit'); setEditing(p); setFormOpen(true) }

  async function handleSubmit(input: ProductInput) {
    setSaving(true)
    try {
      if (formMode === 'edit' && editing) {
        await productsService.update(editing.id, input)
        setToast({ msg: `"${input.name}" updated.`, severity: 'success' })
      } else {
        await productsService.create(input)
        setToast({ msg: `"${input.name}" added.`, severity: 'success' })
      }
      setFormOpen(false)
      void load()
    } catch (e) {
      setToast({ msg: e instanceof Error ? e.message : 'Failed to save.', severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmDelete() {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await productsService.remove(deleting.id)
      setToast({ msg: `"${deleting.name}" deleted.`, severity: 'success' })
      setDeleting(null)
      void load()
    } catch (e) {
      setToast({ msg: e instanceof Error ? e.message : 'Failed to delete.', severity: 'error' })
    } finally {
      setDeleteLoading(false)
    }
  }

  const items = result?.items ?? []
  const hasActiveFilters = filters.search.trim() !== '' || filters.category !== 'All' || filters.sort !== 'featured'

  const headerSx = useMemo(() => ({ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }), [])

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ ...headerSx, justifyContent: 'space-between', mb: 3 }}
        spacing={2}
      >
        <Box>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
            Products
          </Typography>
          <Typography color="text.secondary">
            {result ? `${result.total} product${result.total !== 1 ? 's' : ''}` : 'Manage the product catalogue.'}
          </Typography>
        </Box>
        <Button variant="contained" size="large" startIcon={<AddOutlined />} onClick={openAdd}>
          Add product
        </Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <ProductSearch value={searchInput} onChange={setSearchInput} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ProductFiltersBar filters={filters} onChange={setFilters} />
        </Grid>
        <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
          {hasActiveFilters && (
            <Button onClick={() => { setSearchInput(''); setFilters(DEFAULT_FILTERS) }} variant="text">
              Clear filters
            </Button>
          )}
        </Grid>
      </Grid>

      {error ? (
        <ErrorMessage error={error} onRetry={() => void load()} />
      ) : loading && items.length === 0 ? (
        <Skeleton variant="rectangular" height={360} sx={{ borderRadius: 2 }} />
      ) : items.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? 'No products match your filters' : 'No products yet'}
          description={hasActiveFilters ? 'Try clearing your filters.' : 'Add the first product.'}
          {...(hasActiveFilters ? {} : { actionLabel: 'Add product', onAction: openAdd })}
        />
      ) : (
        <>
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', mb: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Stock</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Featured</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((product) => (
                  <TableRow key={product.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ width: 44, height: 44, borderRadius: 1, overflow: 'hidden', flexShrink: 0 }}>
                          <ProductImage src={product.image} alt={product.name} aspectRatio="1/1" />
                        </Box>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }} noWrap>
                          {product.name}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip label={product.category} size="small" sx={{ bgcolor: 'action.hover' }} />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{formatCurrency(product.price)}</TableCell>
                    <TableCell>
                      <Chip
                        label={product.stock === 0 ? 'Out of stock' : `${product.stock}`}
                        size="small"
                        color={product.stock === 0 ? 'error' : product.stock <= 10 ? 'warning' : 'success'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {product.featured && <Chip label="Featured" size="small" color="primary" variant="outlined" />}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Button size="small" startIcon={<EditOutlined />} onClick={() => openEdit(product)}>
                          Edit
                        </Button>
                        <Button size="small" color="error" startIcon={<DeleteOutline />} onClick={() => setDeleting(product)}>
                          Delete
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
          {loading && items.length > 0 && <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1, mb: 1 }} />}
          {result && (
            <ProductPagination page={page} totalPages={result.totalPages} total={result.total} perPage={PER_PAGE} onChange={setPage} />
          )}
        </>
      )}

      <ProductFormDialog open={formOpen} mode={formMode} initial={editing} loading={saving} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} />
      <DeleteProductDialog product={deleting} loading={deleteLoading} onClose={() => setDeleting(null)} onConfirm={handleConfirmDelete} />

      <Snackbar open={Boolean(toast)} autoHideDuration={3500} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {toast ? <Alert severity={toast.severity} variant="filled" onClose={() => setToast(null)}>{toast.msg}</Alert> : undefined}
      </Snackbar>
    </Container>
  )
}
