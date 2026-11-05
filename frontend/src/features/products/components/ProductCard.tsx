import {
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  IconButton,
  Rating,
  Tooltip,
  Typography,
} from '@mui/material'
import EditOutlined from '@mui/icons-material/EditOutlined'
import DeleteOutline from '@mui/icons-material/DeleteOutlineOutlined'
import AddShoppingCartOutlined from '@mui/icons-material/AddShoppingCartOutlined'
import { Link } from 'react-router-dom'
import type { Product } from '../types/product.types'
import { PATHS, buildPath } from '@/shared/config/paths'
import { formatCurrency } from '@/shared/lib/formatters'
import { useCart } from '@/features/cart'
import ProductImage from './ProductImage'

interface ProductCardProps {
  product: Product
  /** When provided, an Edit button is shown. Omit on storefront pages. */
  onEdit?: (product: Product) => void
  /** When provided, a Delete button is shown. Omit on storefront pages. */
  onDelete?: (product: Product) => void
}

/** Compact stock/availability badge colour helper. */
function availabilityColor(product: Product) {
  if (product.stock === 0) return 'error'
  if (product.stock <= 10) return 'warning'
  return 'success'
}

export default function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const { addItem } = useCart()
  const outOfStock = product.stock === 0
  const detailPath = buildPath(PATHS.productDetail, { id: String(product.id) })

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 150ms ease, box-shadow 150ms ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 16px rgba(28,25,23,0.06)',
        },
        '&:focus-within': {
          boxShadow: '0 4px 16px rgba(28,25,23,0.06)',
        },
      }}
    >
      {/* Image + hover quick actions */}
      <Box sx={{ position: 'relative' }}>
        <CardActionArea
          component={Link}
          to={detailPath}
          aria-label={`View ${product.name}`}
          focusRipple
        >
          <ProductImage src={product.image} alt={product.name} aspectRatio="1 / 1" />
        </CardActionArea>

        {/* Category chip */}
        <Chip
          label={product.category}
          size="small"
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            bgcolor: 'action.hover',
            fontWeight: 600,
            color: 'text.primary',
          }}
        />

        {/* Out-of-stock overlay */}
        {outOfStock && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(245,245,244,0.75)',
            }}
          >
            <Chip
              label="Out of stock"
              color="error"
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Box>
        )}

        {/* Management actions (admin/storefront management only) */}
        {(onEdit || onDelete) && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              display: 'flex',
              gap: 0.5,
              // Reveal on hover for desktop, always visible on touch
              opacity: { xs: 1, sm: 0 },
              transition: 'opacity 0.2s ease',
              '.MuiCard-root:hover &': { opacity: 1 },
            }}
          >
            {onEdit && (
              <Tooltip title="Edit product">
                <IconButton
                  size="small"
                  aria-label={`Edit ${product.name}`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onEdit(product)
                  }}
                  sx={{
                    bgcolor: 'background.paper',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <EditOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip title="Delete product">
                <IconButton
                  size="small"
                  aria-label={`Delete ${product.name}`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onDelete(product)
                  }}
                  sx={{
                    bgcolor: 'background.paper',
                    color: 'error.main',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <DeleteOutline fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      </Box>

      {/* Body */}
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            color: 'text.secondary',
          }}
        >
          <Rating
            value={product.rating}
            precision={0.5}
            readOnly
            size="small"
            aria-label={`Rated ${product.rating} out of 5`}
          />
          <Typography variant="caption" color="text.secondary">
            {product.rating.toFixed(1)} ({product.reviewCount})
          </Typography>
        </Box>

        <Typography
          component={Link}
          to={detailPath}
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            textDecoration: 'none',
            color: 'text.primary',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.3,
            minHeight: '2.6em',
            '&:hover': { color: 'primary.dark' },
            '&:focus-visible': {
              outline: '2px solid',
              outlineColor: 'primary.main',
              borderRadius: 1,
            },
          }}
        >
          {product.name}
        </Typography>

        <Box sx={{ mt: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
            <Typography
              variant="h6"
              component="span"
              sx={{ fontWeight: 700, color: 'text.primary' }}
            >
              {formatCurrency(product.price)}
            </Typography>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <Typography
                variant="body2"
                component="span"
                sx={{ textDecoration: 'line-through', color: 'text.disabled' }}
              >
                {formatCurrency(product.compareAtPrice)}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mt: 1,
            }}
          >
            <Chip
              label={product.availability ?? (outOfStock ? 'Out of stock' : 'In stock')}
              color={availabilityColor(product) as 'success' | 'warning' | 'error'}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          </Box>

          <Button
            fullWidth
            variant="contained"
            size="medium"
            startIcon={<AddShoppingCartOutlined />}
            disabled={outOfStock}
            onClick={() => addItem(product, 1)}
            sx={{ mt: 1.5 }}
            aria-label={`Add ${product.name} to cart`}
          >
            {outOfStock ? 'Unavailable' : 'Add to cart'}
          </Button>
        </Box>
      </Box>
    </Card>
  )
}
