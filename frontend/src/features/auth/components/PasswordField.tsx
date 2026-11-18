import { useState, type ChangeEvent } from 'react'
import { IconButton, InputAdornment, TextField, Tooltip } from '@mui/material'
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlined from '@mui/icons-material/VisibilityOffOutlined'

interface PasswordFieldProps {
  name: string
  label: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  error?: string | undefined
  autoComplete?: string
  /** Mark as required for the label asterisk. */
  required?: boolean
}

/**
 * Password input with a show/hide visibility toggle. Reused by the login and
 * registration forms for a consistent, accessible experience.
 */
export default function PasswordField({
  name,
  label,
  value,
  onChange,
  error,
  autoComplete,
  required,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <TextField
      name={name}
      label={label}
      type={visible ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      error={Boolean(error)}
      helperText={error}
      required={required}
      autoComplete={autoComplete}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title={visible ? 'Hide password' : 'Show password'}>
                <IconButton
                  aria-label={visible ? 'Hide password' : 'Show password'}
                  onClick={() => setVisible((v) => !v)}
                  edge="end"
                >
                  {visible ? <VisibilityOffOutlined /> : <VisibilityOutlined />}
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        },
      }}
    />
  )
}
