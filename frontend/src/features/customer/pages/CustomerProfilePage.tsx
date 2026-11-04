import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import PersonOutlined from '@mui/icons-material/PersonOutlined'
import { useAuth } from '@/features/auth'
import { usersService } from '@/features/users'
import { required, email as validateEmail, minLength, passwordConfirmation } from '@/shared/lib/validators'
import PasswordField from '@/features/auth/components/PasswordField'

// ─── Profile form ─────────────────────────────────────────────────────────────
interface ProfileValues { name: string; email: string }
interface ProfileErrors { name?: string; email?: string }

function validateProfile(v: ProfileValues): ProfileErrors {
  const e: ProfileErrors = {}
  const nameErr = required(v.name, 'Name') ?? minLength(v.name, 2, 'Name')
  if (nameErr) e.name = nameErr
  const emailErr = required(v.email, 'Email') ?? validateEmail(v.email)
  if (emailErr) e.email = emailErr
  return e
}

// ─── Password form ────────────────────────────────────────────────────────────
interface PasswordValues { current: string; next: string; confirm: string }
interface PasswordErrors { current?: string; next?: string; confirm?: string }

function validatePassword(v: PasswordValues): PasswordErrors {
  const e: PasswordErrors = {}
  if (!v.current) e.current = 'Current password is required.'
  if (!v.next) e.next = 'New password is required.'
  else if (v.next.length < 8) e.next = 'Password must be at least 8 characters.'
  if (!v.confirm) e.confirm = 'Please confirm your new password.'
  else {
    const matchErr = passwordConfirmation(v.confirm, v.next)
    if (matchErr) e.confirm = matchErr
  }
  return e
}

export default function CustomerProfilePage() {
  const { user, login } = useAuth()

  // ── Profile section ──────────────────────────────────────────────────────
  const [profile, setProfile] = useState<ProfileValues>({ name: '', email: '' })
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({})
  const [profileSaving, setProfileSaving] = useState(false)

  // ── Password section ─────────────────────────────────────────────────────
  const [pwd, setPwd] = useState<PasswordValues>({ current: '', next: '', confirm: '' })
  const [pwdErrors, setPwdErrors] = useState<PasswordErrors>({})
  const [pwdSaving, setPwdSaving] = useState(false)

  // ── Toast ────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null)

  // Seed profile form from auth context once the user is available
  useEffect(() => {
    if (user) setProfile({ name: user.name, email: user.email })
  }, [user])

  // ── Profile handlers ─────────────────────────────────────────────────────
  function handleProfileChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setProfile((prev) => ({ ...prev, [name]: value }))
    setProfileErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault()
    const errs = validateProfile(profile)
    setProfileErrors(errs)
    if (Object.keys(errs).length > 0 || !user) return

    setProfileSaving(true)
    try {
      const updated = await usersService.updateProfile(user.id, {
        name: profile.name.trim(),
        email: profile.email.trim(),
      })
      // Persist updated user in auth context so the header reflects the new name
      login(
        { id: updated.id, name: updated.name, email: updated.email, role: updated.role },
        localStorage.getItem('auth_token') ?? '',
      )
      setToast({ msg: 'Profile updated successfully.', severity: 'success' })
    } catch (e) {
      setToast({ msg: e instanceof Error ? e.message : 'Failed to update profile.', severity: 'error' })
    } finally {
      setProfileSaving(false)
    }
  }

  // ── Password handlers ────────────────────────────────────────────────────
  function handlePwdChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setPwd((prev) => ({ ...prev, [name]: value }))
    setPwdErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  async function handlePwdSubmit(e: FormEvent) {
    e.preventDefault()
    const errs = validatePassword(pwd)
    setPwdErrors(errs)
    if (Object.keys(errs).length > 0) return

    setPwdSaving(true)
    try {
      // Mock: simulate a 400ms password change — no real verification
      await new Promise((r) => setTimeout(r, 400))
      setPwd({ current: '', next: '', confirm: '' })
      setToast({ msg: 'Password changed successfully.', severity: 'success' })
    } catch {
      setToast({ msg: 'Failed to change password.', severity: 'error' })
    } finally {
      setPwdSaving(false)
    }
  }

  if (!user) return null

  const initials = user.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, md: 6 } }}>
      {/* Header */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
        <PersonOutlined color="primary" fontSize="large" aria-hidden />
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
          My Profile
        </Typography>
      </Stack>

      {/* Avatar + identity */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: '1.25rem', fontWeight: 700 }}>
          {initials}
        </Avatar>
        <Box>
          <Typography sx={{ fontWeight: 700 }}>{user.name}</Typography>
          <Typography variant="body2" color="text.secondary">{user.email}</Typography>
          <Typography
            variant="caption"
            sx={{
              textTransform: 'capitalize',
              bgcolor: user.role === 'admin' ? 'primary.light' : 'action.hover',
              color: user.role === 'admin' ? 'primary.dark' : 'text.secondary',
              px: 1,
              py: 0.25,
              borderRadius: 1,
              fontWeight: 600,
            }}
          >
            {user.role}
          </Typography>
        </Box>
      </Paper>

      {/* ── Edit profile ── */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Account information
        </Typography>
        <Box
          component="form"
          onSubmit={(e) => void handleProfileSubmit(e)}
          noValidate
          aria-label="Edit profile form"
        >
          <Stack spacing={2}>
            <TextField
              name="name"
              label="Display name"
              value={profile.name}
              onChange={handleProfileChange}
              error={Boolean(profileErrors.name)}
              helperText={profileErrors.name}
              required
              autoComplete="name"
            />
            <TextField
              name="email"
              label="Email address"
              type="email"
              value={profile.email}
              onChange={handleProfileChange}
              error={Boolean(profileErrors.email)}
              helperText={profileErrors.email}
              required
              autoComplete="email"
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="contained" disabled={profileSaving}>
                {profileSaving ? 'Saving…' : 'Save changes'}
              </Button>
            </Box>
          </Stack>
        </Box>
      </Paper>

      {/* ── Change password ── */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          Change password
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          In mock mode, the current password is not verified.
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box
          component="form"
          onSubmit={(e) => void handlePwdSubmit(e)}
          noValidate
          aria-label="Change password form"
        >
          <Stack spacing={2}>
            <PasswordField
              name="current"
              label="Current password"
              value={pwd.current}
              onChange={handlePwdChange}
              error={pwdErrors.current}
              autoComplete="current-password"
              required
            />
            <PasswordField
              name="next"
              label="New password"
              value={pwd.next}
              onChange={handlePwdChange}
              error={pwdErrors.next}
              autoComplete="new-password"
              required
            />
            <PasswordField
              name="confirm"
              label="Confirm new password"
              value={pwd.confirm}
              onChange={handlePwdChange}
              error={pwdErrors.confirm}
              autoComplete="new-password"
              required
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="contained" disabled={pwdSaving}>
                {pwdSaving ? 'Saving…' : 'Change password'}
              </Button>
            </Box>
          </Stack>
        </Box>
      </Paper>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? (
          <Alert severity={toast.severity} variant="filled" onClose={() => setToast(null)}>
            {toast.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Container>
  )
}
