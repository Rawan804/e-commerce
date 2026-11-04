import { Box, Container, Divider, Grid, Link as MuiLink, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import { PATHS } from '@/shared/config/paths'

const FOOTER_LINKS = [
  { label: 'Home', path: PATHS.home },
  { label: 'Products', path: PATHS.products },
]

const YEAR = new Date().getFullYear()
export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'background.default',
        color: 'text.secondary',
        mt: 'auto',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} sx={{ py: { xs: 4, md: 5 } }}>
          {/* Brand column */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}
            >
              ShopFront
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.75, maxWidth: 260 }}>
              Quality products delivered to your door. Fast shipping, easy returns, and
              24/7 support.
            </Typography>
          </Grid>

          {/* Navigation column */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                mb: 1.5,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Navigation
            </Typography>
            <Box component="nav" aria-label="Footer navigation">
              <Box
                component="ul"
                sx={{
                  listStyle: 'none',
                  p: 0,
                  m: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.75,
                }}
              >
                {FOOTER_LINKS.map((item) => (
                  <li key={item.path}>
                    <MuiLink
                      component={Link}
                      to={item.path}
                      sx={{
                        color: 'text.secondary',
                        opacity: 0.8,
                        textDecoration: 'none',
                        fontSize: '0.875rem',
                        '&:hover': { opacity: 1, textDecoration: 'underline' },
                        '&:focus-visible': {
                          outline: '2px solid',
                          outlineColor: 'primary.main',
                          borderRadius: 0.5,
                        },
                      }}
                    >
                      {item.label}
                    </MuiLink>
                  </li>
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ borderColor: 'divider' }} />

        <Typography
          variant="body2"
          sx={{ py: 2, color: 'text.secondary', textAlign: 'center' }}
        >
          &copy; {YEAR} ShopFront. All rights reserved.
        </Typography>
      </Container>
    </Box>
  )
}
