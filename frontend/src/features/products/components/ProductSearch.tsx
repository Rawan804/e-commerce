import { InputAdornment, TextField, IconButton, Tooltip } from '@mui/material'
import SearchOutlined from '@mui/icons-material/SearchOutlined'
import ClearOutlined from '@mui/icons-material/ClearOutlined'

interface ProductSearchProps {
  value: string
  onChange: (value: string) => void
  /** Accessible label for screen readers. */
  label?: string
  placeholder?: string
}

/**
 * Controlled search field. Debouncing of the value is handled by the parent
 * via useDebounce so the API call only fires after the user pauses typing.
 */
export default function ProductSearch({
  value,
  onChange,
  label = 'Search products',
  placeholder = 'Search by name or category…',
}: ProductSearchProps) {
  return (
    <TextField
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={label}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchOutlined aria-hidden="true" />
            </InputAdornment>
          ),
          endAdornment: value ? (
            <InputAdornment position="end">
              <Tooltip title="Clear search">
                <IconButton
                  aria-label="Clear search"
                  size="small"
                  onClick={() => onChange('')}
                  edge="end"
                >
                  <ClearOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ) : undefined,
        },
      }}
    />
  )
}
