import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import DeleteOutline from '@mui/icons-material/DeleteOutlineOutlined'
import PeopleOutline from '@mui/icons-material/PeopleOutlineOutlined'
import ShieldOutlined from '@mui/icons-material/ShieldOutlined'
import { useAuth } from '@/features/auth'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { formatDate } from '@/shared/lib/formatters'
import ErrorMessage from '@/shared/components/feedback/ErrorMessage'
import EmptyState from '@/shared/components/feedback/EmptyState'
import ProductSearch from '@/features/products/components/ProductSearch'
import { usersService } from '@/features/users/services/usersService'
import type { User, UserPageResult } from '@/features/users/types/user.types'
import DeleteUserDialog from '@/features/users/components/DeleteUserDialog'

const PER_PAGE = 8

function errMessage(e: unknown, fallback: string): string {
  return typeof e === 'object' && e !== null && 'message' in e
    ? String((e as { message: unknown }).message)
    : fallback
}

// ─── Role change confirmation dialog ─────────────────────────────────────────
interface RoleDialogProps {
  user: User | null
  pendingRole: 'admin' | 'customer' | null
  loading: boolean
  onClose: () => void
  onConfirm: () => void
}

function RoleDialog({ user, pendingRole, loading, onClose, onConfirm }: RoleDialogProps) {
  return (
    <Dialog open={Boolean(user && pendingRole)} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Change role?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Set <strong>{user?.name}</strong> ({user?.email}) to{' '}
          <strong style={{ textTransform: 'capitalize' }}>{pendingRole}</strong>?
          {pendingRole === 'admin' && (
            <Box component="span" display="block" sx={{ mt: 1, color: 'warning.main', fontWeight: 600 }}>
              This will grant full admin access to the storefront.
            </Box>
          )}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={pendingRole === 'admin' ? 'warning' : 'primary'}
          disabled={loading}
          autoFocus
        >
          {loading ? 'Saving…' : 'Confirm'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const { user: me } = useAuth()

  const [searchInput, setSearchInput] = useState('')
  const search = useDebounce(searchInput, 350)
  const [page, setPage] = useState(1)

  const [result, setResult] = useState<UserPageResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  // Delete state
  const [deleting, setDeleting] = useState<User | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Role change state
  const [roleTarget, setRoleTarget] = useState<User | null>(null)
  const [pendingRole, setPendingRole] = useState<'admin' | 'customer' | null>(null)
  const [roleLoading, setRoleLoading] = useState(false)

  const [toast, setToast] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null)

  useEffect(() => { setPage(1) }, [search])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    usersService
      .list({ page, perPage: PER_PAGE, search })
      .then((res) => {
        if (!active) return
        setResult(res)
        if (page > res.totalPages) setPage(res.totalPages)
      })
      .catch((e: unknown) => {
        if (active) setError(errMessage(e, 'Failed to load users.'))
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [page, search, reloadKey])

  const handleDelete = useCallback(async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await usersService.remove(deleting.id)
      setToast({ msg: `"${deleting.name}" deleted.`, severity: 'success' })
      setDeleting(null)
      setReloadKey((k) => k + 1)
    } catch (e) {
      setToast({ msg: errMessage(e, 'Failed to delete user.'), severity: 'error' })
    } finally {
      setDeleteLoading(false)
    }
  }, [deleting])

  function openRoleDialog(user: User, role: 'admin' | 'customer') {
    setRoleTarget(user)
    setPendingRole(role)
  }

  const handleRoleChange = useCallback(async () => {
    if (!roleTarget || !pendingRole) return
    setRoleLoading(true)
    try {
      await usersService.updateRole(roleTarget.id, pendingRole)
      setToast({ msg: `${roleTarget.name} is now ${pendingRole}.`, severity: 'success' })
      setRoleTarget(null)
      setPendingRole(null)
      setReloadKey((k) => k + 1)
    } catch (e) {
      setToast({ msg: errMessage(e, 'Failed to update role.'), severity: 'error' })
    } finally {
      setRoleLoading(false)
    }
  }, [roleTarget, pendingRole])

  const items = result?.items ?? []

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
        <PeopleOutline color="primary" fontSize="large" aria-hidden />
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
          Users
        </Typography>
      </Stack>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Manage accounts and roles{result ? ` — ${result.total} total` : ''}.
      </Typography>

      <Box sx={{ maxWidth: 420, mb: 2 }}>
        <ProductSearch value={searchInput} onChange={setSearchInput} label="Search users" placeholder="Search by name or email…" />
      </Box>

      {error ? (
        <ErrorMessage error={error} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : loading && items.length === 0 ? (
        <Stack spacing={1}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} variant="rounded" height={56} />)}
        </Stack>
      ) : items.length === 0 ? (
        <EmptyState title="No users found" description={search ? 'Try a different search term.' : 'No accounts yet.'} />
      ) : (
        <>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table aria-label="Users table">
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Role</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Joined</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((u) => {
                  const isMe = me?.email === u.email
                  return (
                    <TableRow key={u.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar src={u.avatar} alt={u.name}>
                            {u.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 600 }} noWrap>
                              {u.name}
                              {isMe && <Chip label="You" size="small" sx={{ ml: 1 }} />}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {u.email}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      {/* Role column — inline select for non-self rows */}
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        {isMe ? (
                          <Chip
                            size="small"
                            label={u.role}
                            color={u.role === 'admin' ? 'primary' : 'default'}
                            sx={{ textTransform: 'capitalize' }}
                            icon={u.role === 'admin' ? <ShieldOutlined /> : undefined}
                          />
                        ) : (
                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel id={`role-label-${u.id}`}>Role</InputLabel>
                            <Select
                              labelId={`role-label-${u.id}`}
                              label="Role"
                              value={u.role}
                              onChange={(e) => openRoleDialog(u, e.target.value as 'admin' | 'customer')}
                              sx={{ textTransform: 'capitalize' }}
                            >
                              <MenuItem value="customer">Customer</MenuItem>
                              <MenuItem value="admin">Admin</MenuItem>
                            </Select>
                          </FormControl>
                        )}
                      </TableCell>

                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        {formatDate(u.createdAt)}
                      </TableCell>

                      <TableCell align="right">
                        <Tooltip title={isMe ? "You can't delete yourself" : 'Delete user'}>
                          <span>
                            <IconButton
                              aria-label={`Delete ${u.name}`}
                              color="error"
                              disabled={isMe}
                              onClick={() => setDeleting(u)}
                            >
                              <DeleteOutline />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {result && result.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                page={page}
                count={result.totalPages}
                onChange={(_, p) => setPage(p)}
                color="primary"
                shape="rounded"
              />
            </Box>
          )}
        </>
      )}

      <DeleteUserDialog
        user={deleting}
        loading={deleteLoading}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
      />

      <RoleDialog
        user={roleTarget}
        pendingRole={pendingRole}
        loading={roleLoading}
        onClose={() => { setRoleTarget(null); setPendingRole(null) }}
        onConfirm={handleRoleChange}
      />

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? (
          <Alert severity={toast.severity} variant="filled" onClose={() => setToast(null)} sx={{ width: '100%' }}>
            {toast.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Container>
  )
}
