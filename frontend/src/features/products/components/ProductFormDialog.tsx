import { useEffect, useState, type ChangeEvent } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  Switch,
  TextField,
} from '@mui/material'
import {
  PRODUCT_CATEGORIES,
  type Product,
  type ProductCategory,
  type ProductInput,
  type ProductInputErrors,
} from '../types/product.types'
import ImageUploadField from '@/features/admin/components/ImageUploadField'

interface ProductFormDialogProps {
  open: boolean
  /** 'add' creates a new product, 'edit' updates an existing one. */
  mode: 'add' | 'edit'
  initial: Product | null
  loading: boolean
  onClose: () => void
  onSubmit: (input: ProductInput) => void
}

type ProductFormValues = Omit<ProductInput, 'compareAtPrice'> & {
  compareAtPrice: number | ''
}

const EMPTY_INPUT: ProductFormValues = {
  name: '',
  description: '',
  price: 0,
  compareAtPrice: '',
  category: 'Stationery',
  image: '',
  rating: 0,
  reviewCount: 0,
  stock: 0,
  featured: false,
}

const URL_RE = /^https?:\/\/.+\..+/

function validate(input: ProductFormValues): ProductInputErrors {
  const errors: ProductInputErrors = {}
  if (!input.name.trim()) errors.name = 'Name is required.'
  else if (input.name.trim().length < 3)
    errors.name = 'Name must be at least 3 characters.'

  if (!input.description.trim()) errors.description = 'Description is required.'
  else if (input.description.trim().length < 10)
    errors.description = 'Description must be at least 10 characters.'

  if (input.price === undefined || isNaN(input.price) || input.price <= 0)
    errors.price = 'Price must be a positive number.'

  if (input.compareAtPrice !== '') {
    const n = Number(input.compareAtPrice)
    if (isNaN(n) || n < 0) errors.compareAtPrice = 'Compare-at price must be 0 or more.'
    else if (n <= Number(input.price))
      errors.compareAtPrice = 'Compare-at price should be higher than the price.'
  }

  if (!input.image.trim()) errors.image = 'Image is required.'
  else if (!URL_RE.test(input.image) && !input.image.startsWith('data:'))
    errors.image = 'Enter a valid http(s) image URL or upload a file.'

  if (input.stock === undefined || isNaN(input.stock) || input.stock < 0)
    errors.stock = 'Stock must be 0 or more.'

  if (input.rating < 0 || input.rating > 5)
    errors.rating = 'Rating must be between 0 and 5.'
  if (input.reviewCount < 0) errors.reviewCount = 'Reviews must be 0 or more.'

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
  const [input, setInput] = useState<ProductFormValues>(EMPTY_INPUT)
  const [errors, setErrors] = useState<ProductInputErrors>({})
  const [touched, setTouched] = useState(false)

  // Sync form state whenever the dialog opens or the initial product changes.
  useEffect(() => {
    if (!open) return
    setTouched(false)
    setErrors({})
    if (mode === 'edit' && initial) {
      setInput({
        name: initial.name,
        description: initial.description,
        price: initial.price,
        compareAtPrice: initial.compareAtPrice ?? '',
        category: initial.category,
        image: initial.image,
        rating: initial.rating,
        reviewCount: initial.reviewCount,
        stock: initial.stock,
        featured: initial.featured,
      })
    } else {
      setInput(EMPTY_INPUT)
    }
  }, [open, mode, initial])

  function update<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }))
    if (touched) setErrors(validate({ ...input, [key]: value }))
  }

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target
    const isNumber = type === 'number'
    update(
      name as keyof ProductFormValues,
      (isNumber
        ? value === ''
          ? ''
          : Number(value)
        : value) as ProductFormValues[keyof ProductFormValues],
    )
  }

  function handleSubmit() {
    setTouched(true)
    // Normalise compareAtPrice: empty string → undefined.
    const { compareAtPrice, ...inputValues } = input
    const normalised: ProductInput = {
      ...inputValues,
      price: Number(input.price),
      stock: Number(input.stock),
      rating: Number(input.rating),
      reviewCount: Number(input.reviewCount),
      ...(compareAtPrice === '' ? {} : { compareAtPrice: Number(compareAtPrice) }),
    }
    const nextErrors = validate(input)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) {
      onSubmit(normalised)
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
              required
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
              slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              name="compareAtPrice"
              label="Compare-at price (optional)"
              type="number"
              value={input.compareAtPrice ?? ''}
              onChange={handleChange}
              error={Boolean(errors.compareAtPrice)}
              helperText={
                errors.compareAtPrice ?? 'Shown struck-through as the original price.'
              }
              slotProps={{ htmlInput: { min: 0, step: '0.01' } }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              name="category"
              label="Category"
              select
              value={input.category}
              onChange={(e) => update('category', e.target.value as ProductCategory)}
            >
              {PRODUCT_CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              name="stock"
              label="Stock"
              type="number"
              value={input.stock}
              onChange={handleChange}
              error={Boolean(errors.stock)}
              helperText={errors.stock}
              slotProps={{ htmlInput: { min: 0, step: '1' } }}
              required
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <ImageUploadField
              value={input.image}
              onChange={(url) => update('image', url)}
              error={errors.image}
            />
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              name="rating"
              label="Rating"
              type="number"
              value={input.rating}
              onChange={handleChange}
              error={Boolean(errors.rating)}
              helperText={errors.rating}
              slotProps={{ htmlInput: { min: 0, max: 5, step: '0.1' } }}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              name="reviewCount"
              label="Reviews"
              type="number"
              value={input.reviewCount}
              onChange={handleChange}
              error={Boolean(errors.reviewCount)}
              helperText={errors.reviewCount}
              slotProps={{ htmlInput: { min: 0, step: '1' } }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={input.featured}
                  onChange={(e) => update('featured', e.target.checked)}
                  aria-label="Featured product"
                />
              }
              label="Feature on the home page"
              sx={{ height: '100%', alignItems: 'center' }}
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

// Re-export for convenience so callers can build an empty input.
export { EMPTY_INPUT }
