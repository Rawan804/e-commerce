import { useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
  IconButton,
  Typography,
} from '@mui/material'
import UploadOutlined from '@mui/icons-material/CloudUploadOutlined'
import ClearOutlined from '@mui/icons-material/ClearOutlined'
import ImageOutlined from '@mui/icons-material/ImageOutlined'

interface ImageUploadFieldProps {
  value: File | null
  existingUrl?: string
  onChange: (file: File | null) => void
  error?: string
}

/**
 * Product images are uploaded as files through Laravel's image endpoint.
 */
export default function ImageUploadField({ value, existingUrl, onChange, error }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!value) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(value)
    setPreview(url)
    return () => { URL.revokeObjectURL(url); }
  }, [value])

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onChange(file)
  }

  function clear() {
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const displayPreview = preview ?? existingUrl ?? null

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
        <Button
          component="label"
          variant="outlined"
          size="small"
          startIcon={<UploadOutlined />}
          sx={{ flexShrink: 0 }}
        >
          Upload image
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={handleFile}
          />
        </Button>
        {value && (
          <IconButton size="small" aria-label="Remove uploaded image" onClick={clear}>
            <ClearOutlined fontSize="small" />
          </IconButton>
        )}
        <Typography variant="caption" color={error ? 'error' : 'text.secondary'}>
          {error ?? (value ? value.name : 'JPG, PNG, or WebP up to 2 MB')}
        </Typography>
      </Box>

      {/* Preview */}
      <Box
        sx={{
          mt: 1.5,
          width: 100,
          height: 100,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        {displayPreview ? (
          <Box
            component="img"
            src={displayPreview}
            alt="Product preview"
            onError={(e) => { (e.currentTarget).style.display = 'none' }}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Box sx={{ color: 'text.disabled', textAlign: 'center' }}>
            <ImageOutlined sx={{ fontSize: 32 }} />
            <Typography variant="caption" sx={{ display: 'block' }}>
              Preview
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}
