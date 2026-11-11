import { Box, Button, Container, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import { PATHS } from '@/shared/config/paths'

export default function PageNotFound() {
  return (
    <Container>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          gap: 3,
        }}
      >
        <Typography
          variant="h1"
          component="p"
          sx={{
            fontSize: { xs: '4rem', md: '7rem' },
            fontWeight: 700,
            color: 'text.disabled',
          }}
        >
          404
        </Typography>
        <Typography variant="h4" component="h1">
          Page not found
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: 400 }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been
          moved.
        </Typography>
        <Button
          component={Link}
          to={PATHS.home}
          variant="contained"
          size="large"
        >
          Go to Homepage
        </Button>
      </Box>
    </Container>
  )
}
