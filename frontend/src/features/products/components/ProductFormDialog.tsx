/**
 * ProductFormDialog
 *
 * Add / Edit form for a product. Initial stock is required on creation only.
 *
 * Image upload uses a separate POST /products/{id}/image endpoint after save.
 * Fields like rating, reviewCount, featured, compareAtPrice are not in the
 * backend schema and have been removed.
 */
import { useEffect, useState, type ChangeEvent } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
} from '@mui/material'
import type { Product, ProductInput, ProductInputErrors } from '../types/product.types'
import ImageUploadField from '@/features/admin/components/ImageUploadField'

interface ProductFormDialogProps {
  open: boolean
  mode: 'add' | 'edit'
  initial: Product | null
  loading: boolean
  onClose: () => void
  onSubmit: (input: ProductInput, image: File | null) => void
}

const EMPTY: ProductInput = {
  name: '',
  description: '',
  price: 0,
  category: '',
  initialStock: 0,
}

function validate(input: ProductInput, mode: 'add' | 'edit'): ProductInputErrors {
  const errors: ProductInputErrors = {}
  if (!input.name.trim()) errors.name = 'Name is required.'
  else if (input.name.trim().length > 150) errors.name = 'Name must be 150 characters or fewer.'
  if (input.description.length > 5000) errors.description = 'Description must be 5000 characters or fewer.'
  if (!Number.isFinite(input.price) || input.price < 0 || input.price > 99999999.99)
    errors.price = 'Price must be between 0 and 99,999,999.99.'
  if (!input.category.trim()) errors.category = 'Category is required.'
  else if (input.category.trim().length > 100) errors.category = 'Category must be 100 characters or fewer.'
  if (mode === 'add') {
    if (input.initialStock === '') errors.initialStock = 'Initial stock quantity is required.'
    else if (!Number.isInteger(input.initialStock) || input.initialStock < 0 || input.initialStock > 100000) {
      errors.initialStock = 'Initial stock must be a whole number between 0 and 100000.'
    }
  }
  return errors
}

export default function ProductFormDialog({
  open,
  mode,
  initial,
  loading,
  onClose,
  onSubmit,
}: ProductFormDialogProps) {
  const [input, setInput] = useState<ProductInput>(EMPTY)
  const [image, setImage] = useState<File | null>(null)
  const [errors, setErrors] = useState<ProductInputErrors>({})
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!open) return
    setTouched(false)
    setErrors({})
    setImage(null)
    if (mode === 'edit' && initial) {
      setInput({
        name: initial.name,
        description: initial.description,
        price: initial.price,
        category: initial.category,
        initialStock: 0,
      })
    } else {
      setInput(EMPTY)
    }
  }, [open, mode, initial])

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target as HTMLInputElement
    const coerced = type === 'number'
      ? value === '' && name === 'initialStock'
        ? ''
        : value === ''
          ? 0
          : Number(value)
      : value
    const next = { ...input, [name]: coerced }
    setInput(next)
    if (touched) setErrors(validate(next, mode))
  }

  function handleSubmit() {
    setTouched(true)
    const nextErrors = validate(input, mode)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) {
      onSubmit({
        ...input,
        price: Number(input.price),
        initialStock: input.initialStock === '' ? 0 : Number(input.initialStock),
      }, image)
    }
  }

  const isEdit = mode === 'edit'

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {isEdit ? 'Edit product' : 'Add a new product'}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <TextField
              name="name"
              label="Product name"
              value={input.name}
              onChange={handleChange}
              error={Boolean(errors.name)}
              helperText={errors.name}
              required
              slotProps={{ htmlInput: { maxLength: 150 } }}
              fullWidth
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              name="description"
              label="Description"
              value={input.description}
              onChange={handleChange}
              error={Boolean(errors.description)}
              helperText={errors.description}
              multiline
              rows={3}
              slotProps={{ htmlInput: { maxLength: 5000 } }}
              fullWidth
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              name="price"
              label="Price (USD)"
              type="number"
              value={input.price}
              onChange={handleChange}
              error={Boolean(errors.price)}
              helperText={errors.price}
              slotProps={{ htmlInput: { min: 0, max: 99999999.99, step: '0.01' } }}
              required
              fullWidth
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              name="category"
              label="Category"
              value={input.category}
              onChange={handleChange}
              error={Boolean(errors.category)}
              helperText={errors.category}
              slotProps={{ htmlInput: { maxLength: 100 } }}
              fullWidth
            />
          </Grid>
          {!isEdit && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="initialStock"
                label="Initial Stock Quantity"
                type="number"
                value={input.initialStock}
                onChange={handleChange}
                error={Boolean(errors.initialStock)}
                helperText={errors.initialStock ?? 'Enter a whole number from 0 to 100000.'}
                slotProps={{ htmlInput: { min: 0, max: 100000, step: 1 } }}
                required
                fullWidth
              />
            </Grid>
          )}
          <Grid size={{ xs: 12 }}>
            <ImageUploadField
              value={image}
              {...(mode === 'edit' && initial ? { existingUrl: initial.image } : {})}
              onChange={setImage}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add product'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
