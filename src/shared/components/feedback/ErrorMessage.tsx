import { Alert, AlertTitle, Box, Button } from '@mui/material'
import type { ApiError } from '@/shared/types/api.types'

interface ErrorMessageProps {
  /** The normalised ApiError from apiClient, or a plain string. */
  error: ApiError | string | null | undefined
  /** Optional retry callback shown as a button. */
  onRetry?: () => void
}

/**
 * Displays a styled error alert. Handles both ApiError objects and plain
 * strings so it works with network errors, form errors, and guard messages.
 *
 * Uses role="alert" so screen readers announce the message immediately.
 */
export default function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  if (!error) return null

  const message = typeof error === 'string' ? error : error.message

  return (
    <Box role="alert" sx={{ my: 2 }}>
      <Alert
        severity="error"
        action={
          onRetry ? (
            <Button
              color="inherit"
              size="small"
              onClick={onRetry}
              sx={{ fontWeight: 600 }}
            >
              Retry
            </Button>
          ) : undefined
        }
      >
        <AlertTitle>Something went wrong</AlertTitle>
        {message}
      </Alert>
    </Box>
  )
}
