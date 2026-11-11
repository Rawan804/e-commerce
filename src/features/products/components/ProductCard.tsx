import {
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material'
import EditOutlined from '@mui/icons-material/EditOutlined'
import DeleteOutline from '@mui/icons-material/DeleteOutlineOutlined'
import AddShoppingCartOutlined from '@mui/icons-material/AddShoppingCartOutlined'
import { Link } from 'react-router-dom'
import { PATHS, buildPath } from '@/shared/config/paths'
import { formatCurrency } from '@/shared/lib/formatters'
import { useCart } from '@/features/cart'
import ProductImage from './ProductImage'
import type { Product } from '@/features/products/types/product.types'


interface ProductCardProps {
  product: Product
  onEdit?: (product: Product) => void
  onDelete?: (product: Product) => void
}

function availabilityColor(product: Product): 'default' | 'success' | 'warning' | 'error' {
  if (product.stock === 0) return 'error'
  if (product.stock !== null && product.stock <= 10) return 'warning'
  if (product.stock === null) return 'default'
  return 'success'
}

export default function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const { addItem } = useCart()
  const outOfStock = product.stock === 0
  const availability = product.stock === null
    ? 'Stock unavailable'
    : product.availability ?? (outOfStock ? 'Out of stock' : 'In stock')
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
      }}
    >
      {/* Image */}
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
            <Chip label="Out of stock" color="error" size="small" sx={{ fontWeight: 700 }} />
          </Box>
        )}

        {/* Admin actions */}
        {(onEdit || onDelete) && (
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              display: 'flex',
              gap: 0.5,
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
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(product) }}
                  sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'action.hover' } }}
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
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(product) }}
                  sx={{ bgcolor: 'background.paper', color: 'error.main', '&:hover': { bgcolor: 'action.hover' } }}
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
          }}
        >
          {product.name}
        </Typography>

        <Box sx={{ mt: 'auto' }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
            {formatCurrency(product.price)}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
            <Chip
              label={availability}
              color={availabilityColor(product)}
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
            onClick={() => { addItem(product, 1); }}
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
