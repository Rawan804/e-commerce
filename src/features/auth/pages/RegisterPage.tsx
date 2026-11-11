import { useState, type ChangeEvent, type FormEvent } from 'react'
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
import PersonAddOutlined from '@mui/icons-material/PersonAddOutlined'
import { Link, useNavigate } from 'react-router-dom'
import { PATHS } from '@/shared/config/paths'
import { email, minLength, passwordConfirmation, required } from '@/shared/lib/validators'
import { useAuth } from '@/features/auth'
import { authService } from '../services/authService'
import PasswordField from '../components/PasswordField'

interface FormValues {
  username: string
  email: string
  password: string
  confirmPassword: string
}
interface FormErrors {
  username?: string
  email?: string
  password?: string
  confirmPassword?: string
}

const INITIAL: FormValues = { username: '', email: '', password: '', confirmPassword: '' }

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {}

  const usernameErr =
    required(values.username, 'Username') ?? minLength(values.username, 3, 'Username')
  if (usernameErr) errors.username = usernameErr

  const emailErr = required(values.email, 'Email') ?? email(values.email)
  if (emailErr) errors.email = emailErr

  if (!values.password) errors.password = 'Password is required.'
  else if (values.password.length < 8)
    errors.password = 'Password must be at least 8 characters.'

  if (!values.confirmPassword) errors.confirmPassword = 'Please confirm your password.'
  else {
    const matchErr = passwordConfirmation(values.confirmPassword, values.password)
    if (matchErr) errors.confirmPassword = matchErr
  }

  return errors
}

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setLoading(true)
    setFormError(null)
    try {
      const { user, token } = await authService.register({
        username: values.username,
        email: values.email,
        password: values.password,
        password_confirmation: values.confirmPassword,
      })
      login(user, token)
      // New registrations are always customers — but use the actual role from
      // the backend rather than assuming, in case it ever changes.
      const dest = user.role === 'admin' ? PATHS.admin : PATHS.account
      navigate(dest, { replace: true })
    } catch (err) {
      if (err && typeof err === 'object' && 'errors' in err) {
        // Laravel 422 field-level validation errors
        const apiErrors = (err as { errors: Record<string, string[]> }).errors
        const nextErrors: FormErrors = {}
        if (apiErrors.name?.[0]) nextErrors.username = apiErrors.name[0]
        if (apiErrors.email?.[0]) nextErrors.email = apiErrors.email[0]
        if (apiErrors.password?.[0]) nextErrors.password = apiErrors.password[0]
        setErrors(nextErrors)
      }
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Unable to create your account. Please try again.'
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
          <PersonAddOutlined fontSize="small" aria-hidden="true" />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          ShopFront
        </Typography>
      </Box>

      <Typography variant="h5" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
        Create your account
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        It only takes a minute. No credit card required.
      </Typography>

      {formError && (
        <Alert severity="error" sx={{ mb: 3 }} role="alert">
          {formError}
        </Alert>
      )}

      <Box
        component="form"
        onSubmit={handleSubmit}
        noValidate
        aria-label="Create account form"
      >
        <Stack spacing={2}>
          <TextField
            name="username"
            label="Username"
            value={values.username}
            onChange={handleChange}
            error={Boolean(errors.username)}
            helperText={
              errors.username ?? '3–30 characters. Shown on your reviews and orders.'
            }
            autoComplete="username"
            required
            slotProps={{ htmlInput: { 'aria-required': true, maxLength: 30 } }}
          />
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
            autoComplete="new-password"
            required
          />
          <PasswordField
            name="confirmPassword"
            label="Confirm password"
            value={values.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            autoComplete="new-password"
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
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </Box>

      <Divider sx={{ my: 3 }}>already a member?</Divider>

      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
        Already have an account?{' '}
        <MuiLink component={Link} to={PATHS.login} sx={{ fontWeight: 600 }}>
          Sign in
        </MuiLink>
      </Typography>
    </Box>
  )
}
