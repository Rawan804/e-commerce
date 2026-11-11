import { Box, Button, Typography } from '@mui/material'
import InboxOutlined from '@mui/icons-material/InboxOutlined'
import type { SvgIconComponent } from '@mui/icons-material'

interface EmptyStateProps {
  /** Main heading. */
  title?: string
  /** Secondary description text. */
  description?: string
  /** Optional action button label. */
  actionLabel?: string
  /** Called when the action button is clicked. */
  onAction?: () => void
  /** Override the default icon. Pass any MUI SvgIcon component. */
  Icon?: SvgIconComponent
}

/**
 * Consistent empty-state placeholder used when a data list returns nothing.
 *
 * @example
 *   <EmptyState
 *     title="No products found"
 *     description="Try adjusting your search or filters."
 *     actionLabel="Clear filters"
 *     onAction={clearFilters}
 *   />
 */
export default function EmptyState({
  title = 'Nothing here yet',
  description,
  actionLabel,
  onAction,
  Icon = InboxOutlined,
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 2,
        py: 8,
        px: 2,
        color: 'text.secondary',
      }}
    >
      <Icon sx={{ fontSize: 64, opacity: 0.35 }} aria-hidden="true" />
      <Typography variant="h6" component="p" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ maxWidth: 360 }}>
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="outlined" onClick={onAction} sx={{ mt: 1 }}>
          {actionLabel}
        </Button>
      )}
    </Box>
  )
}
