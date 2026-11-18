import { useState, type ChangeEvent, type SyntheticEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Divider,
  Link as MuiLink,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import LockOutlined from '@mui/icons-material/LockOutlined'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { PATHS } from '@/shared/config/paths'
import { email, required } from '@/shared/lib/validators'
import { useAuth } from '@/features/auth'
import { authService } from '../services/authService'
import PasswordField from '../components/PasswordField'

interface FormValues {
  email: string
  password: string
}
interface FormErrors {
  email?: string
  password?: string
}

const INITIAL: FormValues = { email: '', password: '' }

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {}
  const emailErr = required(values.email, 'Email') ?? email(values.email)
  if (emailErr) errors.email = emailErr
  if (!values.password) errors.password = 'Password is required.'
  else if (values.password.length < 8)
    errors.password = 'Password must be at least 8 characters.'
  return errors
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname ??
    PATHS.home

  const [values, setValues] = useState<FormValues>(INITIAL)
  const [errors, setErrors] = useState<FormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
    setFormError(null)
  }

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setLoading(true)
    setFormError(null)
    try {
      const { user, token } = await authService.login({
        email: values.email,
        password: values.password,
      })
      login(user, token)
      // Role-aware redirect: admin → /admin, customer → /account
      const requestedAdminPage = from === PATHS.admin || from.startsWith(`${PATHS.admin}/`)
      const destination = user.role === 'admin'
        ? (requestedAdminPage ? from : PATHS.admin)
        : (requestedAdminPage || from === PATHS.home ? PATHS.account : from)
      await navigate(destination, { replace: true })
    } catch (err) {
      if (err && typeof err === 'object' && 'errors' in err) {
        // Laravel 422 field-level validation errors
        const apiErrors = (err as { errors: Record<string, string[]> }).errors
        const nextErrors: FormErrors = {}
        if (apiErrors.email?.[0]) nextErrors.email = apiErrors.email[0]
        if (apiErrors.password?.[0]) nextErrors.password = apiErrors.password[0]
        setErrors(nextErrors)
      }
      const message = err && typeof err === 'object' && 'message' in err
        && typeof err.message === 'string'
        ? err.message
        : 'Unable to sign in. Please try again.'
      setFormError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      {/* Brand header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: 'action.hover',
            color: 'text.primary',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <LockOutlined fontSize="small" aria-hidden="true" />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          ShopFront
        </Typography>
      </Box>

      <Typography variant="h5" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
        Welcome back
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Sign in to track orders, manage your cart, and check out faster.
      </Typography>

      {formError && (
        <Alert severity="error" sx={{ mb: 3 }} role="alert">
          {formError}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} noValidate aria-label="Sign in form">
        <Stack spacing={2}>
          <TextField
            name="email"
            label="Email address"
            type="email"
            value={values.email}
            onChange={handleChange}
            error={Boolean(errors.email)}
            helperText={errors.email}
            autoComplete="email"
            required
            slotProps={{ htmlInput: { 'aria-required': true } }}
          />
          <PasswordField
            name="password"
            label="Password"
            value={values.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete="current-password"
            required
          />
        </Stack>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={loading}
          sx={{ mt: 3 }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </Box>

      <Divider sx={{ my: 3 }}>new here?</Divider>

      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
        Don&apos;t have an account?{' '}
        <MuiLink component={Link} to={PATHS.register} sx={{ fontWeight: 600 }}>
          Create one
        </MuiLink>
      </Typography>
    </Box>
  )
}
