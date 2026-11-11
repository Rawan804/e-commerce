import { useEffect, useState } from 'react'
import {
  Breadcrumbs,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  Link as MuiLink,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined'
import RemoveOutlined from '@mui/icons-material/RemoveOutlined'
import AddOutlined from '@mui/icons-material/AddOutlined'
import AddShoppingCartOutlined from '@mui/icons-material/AddShoppingCartOutlined'
import DeleteOutline from '@mui/icons-material/DeleteOutlineOutlined'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { productsService } from '../services/productsService'
import type { Product } from '../types/product.types'
import { PATHS } from '@/shared/config/paths'
import { formatCurrency } from '@/shared/lib/formatters'
import { useCart } from '@/features/cart'
import { useRole } from '@/shared/hooks/useRole'
import ProductImage from '../components/ProductImage'
import DeleteProductDialog from '../components/DeleteProductDialog'
import ErrorMessage from '@/shared/components/feedback/ErrorMessage'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { addItem, openCart } = useCart()
  const { isAdmin } = useRole()
  const navigate = useNavigate()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [qty, setQty] = useState(1)

  async function load() {
    const productId = Number(id)
    if (!id || !Number.isSafeInteger(productId) || productId < 1) {
      setProduct(null)
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const found = await productsService.getById(productId)
      setProduct(found)
      setQty(1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load product.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // Scroll to top on product change for a clean detail view.
    window.scrollTo({ top: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const outOfStock = product ? product.stock === 0 : false

  async function handleDelete() {
    if (!product) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await productsService.remove(product.id)
      navigate(PATHS.products, { replace: true })
    } catch (e) {
      setDeleteError(
        typeof e === 'object' && e !== null && 'message' in e
          ? String((e).message)
          : 'Failed to delete product.',
      )
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      {/* Breadcrumb + back */}
      <Breadcrumbs sx={{ mb: 3 }} aria-label="Breadcrumb">
        <MuiLink component={Link} to={PATHS.home} color="inherit">
          Home
        </MuiLink>
        <MuiLink component={Link} to={PATHS.products} color="inherit">
          Products
        </MuiLink>
        <Typography color="text.primary">{product?.name ?? 'Product'}</Typography>
      </Breadcrumbs>

      <Button
        component={Link}
        to={PATHS.products}
        startIcon={<ArrowBackOutlined />}
        sx={{ mb: 3, pl: 0 }}
      >
        Back to products
      </Button>

      {loading ? (
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="rectangular" height={420} sx={{ borderRadius: 3 }} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="text" height={56} />
            <Skeleton variant="text" height={24} width="60%" />
            <Skeleton variant="text" height={48} width="40%" />
            <Skeleton
              variant="rectangular"
              height={120}
              sx={{ mt: 2, borderRadius: 1 }}
            />
            <Skeleton
              variant="rectangular"
              height={48}
              width={160}
              sx={{ mt: 2, borderRadius: 8 }}
            />
          </Grid>
        </Grid>
      ) : error ? (
        <ErrorMessage error={error} onRetry={load} />
      ) : !product ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h4" gutterBottom>
            Product not found
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            This product may have been removed or never existed.
          </Typography>
          <Button component={Link} to={PATHS.products} variant="contained">
            Browse products
          </Button>
        </Box>
      ) : (
        <Grid container spacing={{ xs: 3, md: 6 }}>
          {/* Image */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                borderRadius: 1.5,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <ProductImage src={product.image} alt={product.name} aspectRatio="1 / 1" />
            </Box>
          </Grid>

          {/* Info */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={2}>
              <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}
              >
                <Chip
                  label={product.category}
                  size="small"
                  sx={{ bgcolor: 'action.hover', color: 'text.secondary' }}
                />
                <Chip
                  label={product.stock === null ? 'Stock unavailable' : product.availability ?? (outOfStock ? 'Out of stock' : 'In stock')}
                  size="small"
                  color={product.stock === null ? 'default' : outOfStock ? 'error' : 'success'}
                  variant="outlined"
                />
              </Box>

              <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                {product.name}
              </Typography>

              <Typography
                variant="h4"
                component="span"
                sx={{ fontWeight: 700, color: 'text.primary' }}
              >
                {formatCurrency(product.price)}
              </Typography>

              <Divider />

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Description
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {product.description}
                </Typography>
              </Box>

              {/* Quantity + add to cart */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  flexWrap: 'wrap',
                  mt: 1,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                  }}
                >
                  <IconButton
                    aria-label="Decrease quantity"
                    disabled={qty <= 1}
                    onClick={() => { setQty((q) => Math.max(1, q - 1)); }}
                  >
                    <RemoveOutlined />
                  </IconButton>
                  <Typography
                    sx={{ minWidth: 36, textAlign: 'center', fontWeight: 700 }}
                    aria-live="polite"
                  >
                    {qty}
                  </Typography>
                  <IconButton
                    aria-label="Increase quantity"
                    disabled={outOfStock || (product.stock !== null && qty >= product.stock) || qty >= 100}
                    onClick={() => { setQty((q) => Math.min(product.stock ?? 100, q + 1)); }}
                  >
                    <AddOutlined />
                  </IconButton>
                </Box>

                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AddShoppingCartOutlined />}
                  disabled={outOfStock}
                  onClick={() => {
                    addItem(product, qty)
                  }}
                  sx={{ flex: 1, minWidth: 180 }}
                >
                  {outOfStock ? 'Unavailable' : `Add ${qty} to cart`}
                </Button>
              </Box>

              {!outOfStock && (
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => {
                    addItem(product, qty)
                    openCart()
                  }}
                >
                  Buy now
                </Button>
              )}

              {isAdmin && (
                <>
                  <Divider />
                  <Button
                    color="error"
                    variant="text"
                    startIcon={<DeleteOutline />}
                    onClick={() => { setConfirmDelete(true); }}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Delete product
                  </Button>
                  {deleteError && (
                    <Typography variant="body2" color="error" role="alert">
                      {deleteError}
                    </Typography>
                  )}
                </>
              )}

              <Typography variant="caption" color="text.secondary">
                {outOfStock
                  ? 'Currently unavailable.'
                  : product.stock === null
                    ? 'Stock availability will be confirmed when you place the order.'
                    : `${product.stock} in stock`}
              </Typography>
            </Stack>
          </Grid>
        </Grid>
      )}
      <DeleteProductDialog
        product={confirmDelete ? product : null}
        loading={deleting}
        onClose={() => { setConfirmDelete(false); }}
        onConfirm={handleDelete}
      />
    </Container>
  )
}
