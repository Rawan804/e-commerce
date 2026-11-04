import { Box, Button, Container, Typography } from '@mui/material'
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom'
import { PATHS } from '@/shared/config/paths'

export default function RouteError() {
  const error = useRouteError()

  let title = 'Unexpected Error'
  let message = 'Something went wrong. Please try again.'

  if (isRouteErrorResponse(error)) {
    title = `${error.status} — ${error.statusText}`
    message =
      typeof error.data === 'string'
        ? error.data
        : 'An unexpected routing error occurred.'
  } else if (error instanceof Error) {
    message = error.message
  }

  return (
    <Container>
      <Box
        role="alert"
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
        <Typography variant="h3" component="h1">
          {title}
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: 480 }}
        >
          {message}
        </Typography>
        <Button component={Link} to={PATHS.home} variant="contained">
          Return Home
        </Button>
      </Box>
    </Container>
  )
}
