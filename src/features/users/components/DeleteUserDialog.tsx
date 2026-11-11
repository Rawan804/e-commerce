import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'
import type { User } from '../types/user.types'

interface DeleteUserDialogProps {
  user: User | null
  loading: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function DeleteUserDialog({ user, loading, onClose, onConfirm }: DeleteUserDialogProps) {
  return (
    <Dialog open={Boolean(user)} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Delete user?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete <strong>{user?.name}</strong> ({user?.email})? This
          action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained" disabled={loading} autoFocus>
          {loading ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
