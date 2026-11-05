import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'
import type { Product } from '../types/product.types'

interface DeleteProductDialogProps {
  product: Product | null
  loading: boolean
  onClose: () => void
  onConfirm: () => void
}

/**
 * Confirmation dialog before deleting a product. Destructive action is
 * clearly labelled and the product name is shown so users don't delete the
 * wrong item.
 */
export default function DeleteProductDialog({
  product,
  loading,
  onClose,
  onConfirm,
}: DeleteProductDialogProps) {
  return (
    <Dialog open={Boolean(product)} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Delete product?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete{' '}
          <strong>{product?.name}</strong>? This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={loading}
          autoFocus
        >
          {loading ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
