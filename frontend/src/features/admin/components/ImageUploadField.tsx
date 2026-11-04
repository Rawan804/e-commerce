import { useRef, useState } from 'react'
import {
  Box,
  Button,
  IconButton,
  TextField,
  Typography,
} from '@mui/material'
import UploadOutlined from '@mui/icons-material/CloudUploadOutlined'
import ClearOutlined from '@mui/icons-material/ClearOutlined'
import ImageOutlined from '@mui/icons-material/ImageOutlined'

interface ImageUploadFieldProps {
  value: string
  onChange: (url: string) => void
  error?: string
}

export default function ImageUploadField({ value, onChange, error }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setPreview(dataUrl)
      onChange(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  function clear() {
    setPreview(null)
    onChange('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const displayPreview = preview ?? (value && value.startsWith('data:') ? value : null)
  const isLocalFile = displayPreview !== null

  return (
    <Box>
      <TextField
        label="Image URL"
        value={isLocalFile ? '' : value}
        onChange={(e) => {
          setPreview(null)
          onChange(e.target.value)
        }}
        error={Boolean(error)}
        helperText={error ?? (isLocalFile ? 'Using uploaded file' : 'Paste a https:// image URL, or upload a file below')}
        disabled={isLocalFile}
        slotProps={{
          htmlInput: { 'aria-label': 'Product image URL' },
        }}
      />

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
            accept="image/*"
            hidden
            onChange={handleFile}
          />
        </Button>
        {isLocalFile && (
          <IconButton size="small" aria-label="Remove uploaded image" onClick={clear}>
            <ClearOutlined fontSize="small" />
          </IconButton>
        )}
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
        {value || displayPreview ? (
          <Box
            component="img"
            src={displayPreview ?? value}
            alt="Product preview"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Box sx={{ color: 'text.disabled', textAlign: 'center' }}>
            <ImageOutlined sx={{ fontSize: 32 }} />
            <Typography variant="caption" display="block">
              Preview
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}
