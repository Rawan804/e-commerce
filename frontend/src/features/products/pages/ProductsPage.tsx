import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  Skeleton,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material'
import AddOutlined from '@mui/icons-material/AddOutlined'
import { useAuth } from '@/features/auth'
import { useRole } from '@/shared/hooks/useRole'
import { productsService } from '../services/productsService'
import {
  DEFAULT_FILTERS,
  type Product,
  type ProductFilters,
  type ProductInput,
  type ProductPageResult,
} from '../types/product.types'
import { useDebounce } from '@/shared/hooks/useDebounce'
import Loader from '@/shared/components/feedback/Loader'
import ErrorMessage from '@/shared/components/feedback/ErrorMessage'
import EmptyState from '@/shared/components/feedback/EmptyState'
import ProductCard from '../components/ProductCard'
import ProductSearch from '../components/ProductSearch'
import ProductFiltersBar from '../components/ProductFilters'
import ProductPagination from '../components/ProductPagination'
import ProductFormDialog from '../components/ProductFormDialog'
import DeleteProductDialog from '../components/DeleteProductDialog'

const PER_PAGE = 8

export default function ProductsPage() {
  const { isAuthenticated } = useAuth()
  const { isAdmin } = useRole()
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 350)
  const [filters, setFilters] = useState<ProductFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)

  const [result, setResult] = useState<ProductPageResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Keep the filters.search in sync with the debounced input.
  useEffect(() => {
    setFilters((prev) =>
      prev.search === debouncedSearch ? prev : { ...prev, search: debouncedSearch },
    )
  }, [debouncedSearch])

  // Reset to page 1 whenever search, category, or sort changes.
  useEffect(() => {
    setPage(1)
  }, [filters.search, filters.category, filters.sort])

  const [toast, setToast] = useState<{
    msg: string
    severity: 'success' | 'error'
  } | null>(null)
  const showToast = useCallback(
    (msg: string, severity: 'success' | 'error' = 'success') =>
      setToast({ msg, severity }),
    [],
  )

  // ── Dialog state ──────────────────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add')
  const [editing, setEditing] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)

  const [deleting, setDeleting] = useState<Product | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // ── Data fetch (latest-write-wins guard against stale responses) ──────────────
  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    productsService
      .list({ page, perPage: PER_PAGE, filters })
      .then((res) => {
        if (!active) return
        setResult(res)
        // If a filter reduced the page count below the current page, clamp it.
        if (res.totalPages > 0 && page > res.totalPages) setPage(res.totalPages)
      })
      .catch((e: unknown) => {
        if (!active) return
        setError(e instanceof Error ? e.message : 'Failed to load products.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [page, filters])

  function openAdd() {
    setFormMode('add')
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(product: Product) {
    setFormMode('edit')
    setEditing(product)
    setFormOpen(true)
  }

  async function handleSubmit(input: ProductInput) {
    setSaving(true)
    try {
      if (formMode === 'edit' && editing) {
        await productsService.update(editing.id, input)
        showToast(`"${input.name}" updated.`)
      } else {
        await productsService.create(input)
        showToast(`"${input.name}" added.`)
      }
      setFormOpen(false)
      // Refetch to reflect the change.
      const res = await productsService.list({ page, perPage: PER_PAGE, filters })
      setResult(res)
      if (res.totalPages > 0 && page > res.totalPages) setPage(res.totalPages)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to save product.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmDelete() {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await productsService.remove(deleting.id)
      showToast(`"${deleting.name}" deleted.`)
      setDeleting(null)
      const res = await productsService.list({ page, perPage: PER_PAGE, filters })
      setResult(res)
      if (res.totalPages > 0 && page > res.totalPages) setPage(res.totalPages)
      else if (res.total === 0) setPage(1)
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to delete product.', 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.category !== 'All' ||
    filters.sort !== 'featured'

  function clearFilters() {
    setSearchInput('')
    setFilters(DEFAULT_FILTERS)
  }

  const items = result?.items ?? []
  const showSkeletons = loading && items.length === 0

  const headerSx = useMemo(
    () => ({ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }),
    [],
  )

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      {/* Page header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ ...headerSx, justifyContent: 'space-between' }}
        spacing={2}
      >
        <Box>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
            Products
          </Typography>
          <Typography color="text.secondary">
            Browse the catalogue, manage stock, and keep your storefront fresh.
          </Typography>
        </Box>
        {isAdmin && (
          <Button
            variant="contained"
            size="large"
            startIcon={<AddOutlined />}
            onClick={openAdd}
          >
            Add product
          </Button>
        )}
      </Stack>

      {/* Toolbar: search + filters */}
      <Grid container spacing={2} sx={{ mt: 1, mb: 2, alignItems: 'center' }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <ProductSearch value={searchInput} onChange={setSearchInput} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ProductFiltersBar filters={filters} onChange={setFilters} />
        </Grid>
        <Grid
          size={{ xs: 12, md: 2 }}
          sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}
        >
          {hasActiveFilters && (
            <Button onClick={clearFilters} variant="text" sx={{ fontWeight: 600 }}>
              Clear filters
            </Button>
          )}
        </Grid>
      </Grid>

      {/* States */}
      {error ? (
        <ErrorMessage error={error} onRetry={() => setFilters((f) => ({ ...f }))} />
      ) : showSkeletons ? (
        <Grid container spacing={3}>
          {Array.from({ length: PER_PAGE }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
              <Skeleton variant="text" height={28} sx={{ mt: 1 }} />
              <Skeleton variant="text" height={24} width="60%" />
              <Skeleton
                variant="rectangular"
                height={40}
                sx={{ mt: 1, borderRadius: 8 }}
              />
            </Grid>
          ))}
        </Grid>
      ) : items.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? 'No products match your filters' : 'No products yet'}
          description={
            hasActiveFilters
              ? 'Try a different search term, category, or clear your filters.'
              : 'Add your first product to get the storefront started.'
          }
          {...(hasActiveFilters
            ? { actionLabel: 'Clear filters', onAction: clearFilters }
            : isAdmin
              ? { actionLabel: 'Add product', onAction: openAdd }
              : {})}
        />
      ) : (
        <>
          <Grid container spacing={3}>
            {items.map((product) => (
              <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <ProductCard
                  product={product}
                  {...(isAdmin
                    ? { onEdit: openEdit, onDelete: setDeleting }
                    : {})}
                />
              </Grid>
            ))}
          </Grid>

          {loading && items.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Loader label="Updating…" />
            </Box>
          )}

          {result && (
            <ProductPagination
              page={page}
              totalPages={result.totalPages}
              total={result.total}
              perPage={PER_PAGE}
              onChange={setPage}
            />
          )}
        </>
      )}

      {/* Add / edit dialog */}
      <ProductFormDialog
        open={formOpen}
        mode={formMode}
        initial={editing}
        loading={saving}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      {/* Delete confirmation */}
      <DeleteProductDialog
        product={deleting}
        loading={deleteLoading}
        onClose={() => setDeleting(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Toast */}
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? (
          <Alert
            severity={toast.severity}
            variant="filled"
            onClose={() => setToast(null)}
            sx={{ width: '100%' }}
          >
            {toast.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Container>
  )
}
