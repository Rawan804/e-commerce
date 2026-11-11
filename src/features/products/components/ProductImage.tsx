import { useState } from 'react'
import { Box, type BoxProps } from '@mui/material'
import BrokenImageOutlined from '@mui/icons-material/BrokenImageOutlined'

interface ProductImageProps {
  src: string
  alt: string
  /** Aspect ratio of the image frame, e.g. '1 / 1' or '4 / 3'. */
  aspectRatio?: string
  /** Extra sx applied to the frame. */
  sx?: BoxProps['sx']
}

/**
 * A responsive product image with a graceful, polished fallback. If the remote
 * source fails to load (offline, bad URL, CORS), it swaps to a branded
 * placeholder instead of showing the browser's broken-image icon.
 *
 * Uses native lazy-loading + async decoding for performance.
 */
export default function ProductImage({
  src,
  alt,
  aspectRatio = '1 / 1',
  sx,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <Box
        role="img"
        aria-label={alt}
        sx={{
          aspectRatio,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          color: 'text.disabled',
          bgcolor: 'action.hover',
          ...sx,
        }}
      >
        <BrokenImageOutlined sx={{ fontSize: 40 }} aria-hidden="true" />
        <Box
          component="span"
          sx={{
            px: 2,
            fontSize: '0.75rem',
            textAlign: 'center',
            maxWidth: '80%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {alt}
        </Box>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        position: 'relative',
        aspectRatio,
        width: '100%',
        overflow: 'hidden',
        bgcolor: 'background.default',
        ...sx,
      }}
    >
      <Box
        component="img"
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    </Box>
  )
}
