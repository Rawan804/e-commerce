import { Box, CircularProgress, Typography } from '@mui/material'

interface LoaderProps {
  /** Accessible label read by screen readers. Default: "Loading…" */
  label?: string
  /** Stretch to fill the viewport height instead of just the container. */
  fullPage?: boolean
}

/**
 * Centred loading spinner with an accessible live region.
 *
 * Usage:
 *   <Loader />                      — inline, fills its container
 *   <Loader fullPage label="Fetching products…" />
 */
export default function Loader({ label = 'Loading…', fullPage = false }: LoaderProps) {
  return (
    <Box
      role="status"
      aria-label={label}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        minHeight: fullPage ? '60vh' : 120,
        width: '100%',
      }}
    >
      <CircularProgress aria-hidden="true" />
      <Typography variant="body2" color="text.secondary" aria-hidden="true">
        {label}
      </Typography>
    </Box>
  )
}
