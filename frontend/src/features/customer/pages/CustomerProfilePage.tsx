import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import {
    Alert,
    Avatar,
    Box,
    Button,
    Container,
    Paper,
    Snackbar,
    Stack,
    TextField,
    Typography,
} from '@mui/material'
import PersonOutlined from '@mui/icons-material/PersonOutlined'
import { useAuth } from '@/features/auth'
import { usersService } from '@/features/users'
import { email as validateEmail, minLength, required } from '@/shared/lib/validators'

interface ProfileValues {
    name: string
    email: string
}

interface ProfileErrors {
    name?: string
    email?: string
}

function validateProfile(values: ProfileValues): ProfileErrors {
    const errors: ProfileErrors = {}
    const nameError = required(values.name, 'Name') ?? minLength(values.name, 2, 'Name')
    if (nameError) errors.name = nameError
    const emailError = required(values.email, 'Email') ?? validateEmail(values.email)
    if (emailError) errors.email = emailError
    return errors
}

export default function CustomerProfilePage() {
    const { user, token, login } = useAuth()
    const [profile, setProfile] = useState<ProfileValues>({ name: '', email: '' })
    const [errors, setErrors] = useState<ProfileErrors>({})
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null)

    useEffect(() => {
        if (user) setProfile({ name: user.name, email: user.email })
    }, [user])

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target
        setProfile((current) => ({ ...current, [name]: value }))
        setErrors((current) => ({ ...current, [name]: undefined }))
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault()
        const nextErrors = validateProfile(profile)
        setErrors(nextErrors)
        if (Object.keys(nextErrors).length > 0 || !user) return

        setSaving(true)
        try {
            const updated = await usersService.updateProfile({
                name: profile.name.trim(),
                email: profile.email.trim(),
            })
            login(
                { id: updated.id, name: updated.name, email: updated.email, role: updated.role },
                token ?? '',
            )
            setToast({ msg: 'Profile updated successfully.', severity: 'success' })
        } catch (error) {
            setToast({
                msg: typeof error === 'object' && error !== null && 'message' in error
                    ? String((error).message)
                    : 'Failed to update profile.',
                severity: 'error',
            })
        } finally {
            setSaving(false)
        }
    }

    if (!user) return null

    const initials = user.name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    return (
        <Container maxWidth="sm" sx={{ py: { xs: 4, md: 6 } }}>
            <Stack direction="row" spacing={2} sx={{ mb: 4, alignItems: 'center' }}>
                <PersonOutlined color="primary" fontSize="large" aria-hidden />
                <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
                    My Profile
                </Typography>
            </Stack>

            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: '1.25rem', fontWeight: 700 }}>
                    {initials}
                </Avatar>
                <Box>
                    <Typography sx={{ fontWeight: 700 }}>{user.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                    <Typography variant="caption" sx={{ textTransform: 'capitalize', fontWeight: 600 }}>
                        {user.role}
                    </Typography>
                </Box>
            </Paper>

            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    Account information
                </Typography>
                <Box component="form" onSubmit={(event) => void handleSubmit(event)} noValidate aria-label="Edit profile form">
                    <Stack spacing={2}>
                        <TextField
                            name="name"
                            label="Display name"
                            value={profile.name}
                            onChange={handleChange}
                            error={Boolean(errors.name)}
                            helperText={errors.name}
                            required
                            autoComplete="name"
                        />
                        <TextField
                            name="email"
                            label="Email address"
                            type="email"
                            value={profile.email}
                            onChange={handleChange}
                            error={Boolean(errors.email)}
                            helperText={errors.email}
                            required
                            autoComplete="email"
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button type="submit" variant="contained" disabled={saving}>
                                {saving ? 'Saving…' : 'Save changes'}
                            </Button>
                        </Box>
                    </Stack>
                </Box>
            </Paper>

            <Snackbar
                open={Boolean(toast)}
                autoHideDuration={4000}
                onClose={() => { setToast(null); }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                {toast ? (
                    <Alert severity={toast.severity} variant="filled" onClose={() => { setToast(null); }}>
                        {toast.msg}
                    </Alert>
                ) : undefined}
            </Snackbar>
        </Container>
    )
}