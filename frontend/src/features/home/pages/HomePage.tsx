import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Link as MuiLink,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import ArrowForwardOutlined from '@mui/icons-material/ArrowForwardOutlined'
import LocalShippingOutlined from '@mui/icons-material/LocalShippingOutlined'
import VerifiedOutlined from '@mui/icons-material/VerifiedOutlined'
import SupportAgentOutlined from '@mui/icons-material/SupportAgentOutlined'
import ReplayOutlined from '@mui/icons-material/ReplayOutlined'
import { Link } from 'react-router-dom'
import { PATHS } from '@/shared/config/paths'
import { productsService } from '@/features/products/services/productsService'
import type { Product, ProductCategory } from '@/features/products/types/product.types'
import { PRODUCT_CATEGORIES } from '@/features/products/types/product.types'
import ProductCard from '@/features/products/components/ProductCard'
import ProductImage from '@/features/products/components/ProductImage'
import stationeryImage from '@/shared/assets/stationery-desk.jpg'

const BENEFITS = [
  { Icon: LocalShippingOutlined, title: 'Free shipping', desc: 'On orders over $75' },
  { Icon: ReplayOutlined, title: '30-day returns', desc: 'No questions asked' },
  { Icon: VerifiedOutlined, title: 'Secure payments', desc: 'Encrypted at checkout' },
  { Icon: SupportAgentOutlined, title: '24/7 support', desc: 'Real humans, anytime' },
]

const CATEGORY_BLURB: Record<ProductCategory, string> = {
  Stationery: 'Notebooks, pens & desk essentials',
  Audio: 'Headphones, earbuds & speakers',
  Wearables: 'Smartwatches & fitness',
  Photography: 'Cameras & lenses',
  Computing: 'Monitors & setups',
  'Home & Kitchen': 'Everyday essentials',
}

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    productsService
      .getFeatured(4)
      .then((items) => active && setFeatured(items))
      .catch(() => active && setFeatured([]))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  return (
    <Box>
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          bgcolor: 'background.default',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
          <Grid container spacing={4} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Chip
                label="New season drop"
                size="small"
                sx={{
                  bgcolor: 'action.hover',
                  color: 'text.secondary',
                  fontWeight: 600,
                  mb: 2,
                }}
              />
              <Typography
                variant="h2"
                component="h1"
                sx={{ fontWeight: 600, mb: 2, lineHeight: 1.1, maxWidth: 560 }}
              >
                Tech that moves with you.
              </Typography>
              <Typography
                variant="h6"
                component="p"
                sx={{ color: 'text.secondary', maxWidth: 480, mb: 4, fontWeight: 400 }}
              >
                Curated audio, wearables, and gear from brands you trust — delivered fast,
                with returns that are actually easy.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  component={Link}
                  to={PATHS.products}
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardOutlined />}
                  sx={{
                    px: 3,
                  }}
                >
                  Shop now
                </Button>
              </Stack>
            </Grid>

            {/* Hero showcase */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  position: 'relative',
                  display: { xs: 'none', md: 'block' },
                }}
              >
                <Box
                  sx={{
                    borderRadius: 1.5,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <ProductImage
                    src={stationeryImage}
                    alt="A notebook and pen ready for writing"
                    aspectRatio="4 / 3"
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── Benefits strip ─────────────────────────────────────────────────── */}
      <Container maxWidth="lg">
        <Grid
          container
          spacing={2}
          sx={{ py: 3, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          {BENEFITS.map(({ Icon, title, desc }) => (
            <Grid key={title} size={{ xs: 6, md: 3 }}>
              <Box
                sx={{
                  py: 1.5,
                  height: '100%',
                  display: 'flex',
                  gap: 1.5,
                  alignItems: 'flex-start',
                }}
              >
                <Box
                  sx={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'text.secondary',
                    pt: 0.25,
                  }}
                >
                  <Icon aria-hidden="true" />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {desc}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* ── Featured products ──────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          sx={{
            mb: 4,
            gap: 2,
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
          }}
        >
          <Box>
            <Typography variant="h4" component="h2" sx={{ fontWeight: 700 }}>
              Featured products
            </Typography>
            <Typography color="text.secondary">
              Hand-picked favourites our customers love right now.
            </Typography>
          </Box>
          <Button
            component={Link}
            to={PATHS.products}
            endIcon={<ArrowForwardOutlined />}
            sx={{ fontWeight: 600 }}
          >
            View all
          </Button>
        </Stack>

        {loading ? (
          <Grid container spacing={3}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
                <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
                <Skeleton variant="text" height={28} sx={{ mt: 1 }} />
                <Skeleton variant="text" height={24} width="60%" />
              </Grid>
            ))}
          </Grid>
        ) : featured.length === 0 ? (
          <Typography color="text.secondary">No featured products yet.</Typography>
        ) : (
          <Grid container spacing={3}>
            {featured.map((product) => (
              <Grid key={product.id} size={{ xs: 12, sm: 6, md: 3 }}>
                <ProductCard product={product} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* ── Shop by category ───────────────────────────────────────────────── */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
          <Typography variant="h4" component="h2" sx={{ fontWeight: 700, mb: 1 }}>
            Shop by category
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            Find exactly what you need across our departments.
          </Typography>
          <Grid container spacing={3}>
            {PRODUCT_CATEGORIES.map((category) => (
              <Grid key={category} size={{ xs: 12, sm: 6, md: 4 }}>
                <MuiLink
                  component={Link}
                  to={PATHS.products}
                  underline="none"
                  sx={{ display: 'block', height: '100%' }}
                >
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: 1.5,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'border-color 150ms ease, background-color 150ms ease',
                      '&:hover': {
                        bgcolor: 'action.hover',
                        borderColor: 'primary.main',
                      },
                      '&:focus-visible': {
                        outline: '2px solid',
                        outlineColor: 'primary.main',
                      },
                    }}
                  >
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {category}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {CATEGORY_BLURB[category]}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        color: 'primary.main',
                        fontWeight: 700,
                      }}
                    >
                      Explore
                      <ArrowForwardOutlined
                        sx={{ fontSize: 18, ml: 0.5 }}
                        aria-hidden="true"
                      />
                    </Box>
                  </Box>
                </MuiLink>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

    
    </Box>
  )
}
