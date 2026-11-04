import { useState, type ChangeEvent, type FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material'
import CheckCircleOutlineOutlined from '@mui/icons-material/CheckCircleOutlineOutlined'
import LockOutlined from '@mui/icons-material/LockOutlined'
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { useCart } from '@/features/cart'
import { ordersService } from '@/features/orders'
import type { OrderAddress } from '@/features/orders'
import { formatCurrency } from '@/shared/lib/formatters'
import { required, email, minLength } from '@/shared/lib/validators'
import { PATHS } from '@/shared/config/paths'
import ProductImage from '@/features/products/components/ProductImage'

// ─── Types ────────────────────────────────────────────────────────────────────
interface AddressValues {
  fullName: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: string
}
type AddressErrors = Partial<Record<keyof AddressValues, string>>

interface PaymentValues {
  cardName: string
  cardNumber: string
  expiry: string
  cvv: string
}
type PaymentErrors = Partial<Record<keyof PaymentValues, string>>

const EMPTY_ADDRESS: AddressValues = {
  fullName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
}

const EMPTY_PAYMENT: PaymentValues = {
  cardName: '',
  cardNumber: '',
  expiry: '',
  cvv: '',
}

const STEPS = ['Review cart', 'Shipping', 'Payment', 'Confirmation']
const FREE_SHIPPING_THRESHOLD = 75

// ─── Validation ───────────────────────────────────────────────────────────────
function validateAddress(v: AddressValues): AddressErrors {
  const e: AddressErrors = {}
  if (required(v.fullName)) e.fullName = required(v.fullName, 'Full name')!
  if (required(v.addressLine1)) e.addressLine1 = required(v.addressLine1, 'Address')!
  if (required(v.city)) e.city = required(v.city, 'City')!
  if (required(v.state)) e.state = required(v.state, 'State / Province')!
  const pcErr = required(v.postalCode, 'Postal code') ?? minLength(v.postalCode, 4, 'Postal code')
  if (pcErr) e.postalCode = pcErr
  if (required(v.country)) e.country = required(v.country, 'Country')!
  return e
}

function validatePayment(v: PaymentValues): PaymentErrors {
  const e: PaymentErrors = {}
  if (required(v.cardName)) e.cardName = required(v.cardName, 'Name on card')!
  const stripped = v.cardNumber.replace(/\s/g, '')
  if (!stripped || stripped.length < 13 || stripped.length > 19 || !/^\d+$/.test(stripped))
    e.cardNumber = 'Enter a valid card number (13–19 digits).'
  if (!v.expiry || !/^\d{2}\/\d{2}$/.test(v.expiry))
    e.expiry = 'Enter expiry as MM/YY.'
  if (!v.cvv || !/^\d{3,4}$/.test(v.cvv))
    e.cvv = 'Enter a 3 or 4 digit CVV.'
  return e
}

// ─── Formatters ───────────────────────────────────────────────────────────────
function formatCardNumber(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}
function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return digits
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function OrderSummary({ subtotal, shipping }: { subtotal: number; shipping: number }) {
  const { items } = useCart()
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
        Order summary
      </Typography>
      <Stack spacing={1.5} divider={<Divider flexItem />}>
        {items.map((item) => (
          <Box key={item.productId} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Box sx={{ width: 48, height: 48, borderRadius: 1, overflow: 'hidden', flexShrink: 0 }}>
              <ProductImage src={item.image} alt={item.name} aspectRatio="1/1" />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{item.name}</Typography>
              <Typography variant="caption" color="text.secondary">Qty: {item.qty}</Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatCurrency(item.price * item.qty)}
            </Typography>
          </Box>
        ))}
      </Stack>
      <Divider sx={{ my: 1.5 }} />
      <Stack spacing={0.5}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">Subtotal</Typography>
          <Typography variant="body2">{formatCurrency(subtotal)}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">Shipping</Typography>
          <Typography variant="body2">
            {shipping === 0
              ? <Typography component="span" variant="body2" color="success.main">Free</Typography>
              : formatCurrency(shipping)}
          </Typography>
        </Box>
        <Divider sx={{ my: 0.5 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 700 }}>Total</Typography>
          <Typography sx={{ fontWeight: 700 }}>{formatCurrency(subtotal + shipping)}</Typography>
        </Box>
      </Stack>
    </Paper>
  )
}

// ─── Step 0 — Cart review ─────────────────────────────────────────────────────
function StepReview({ onNext }: { onNext: () => void }) {
  const { items, total } = useCart()
  const shipping = total >= FREE_SHIPPING_THRESHOLD ? 0 : 5.99
  if (items.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Your cart is empty.</Typography>
        <Button component={Link} to={PATHS.products} variant="contained">Browse products</Button>
      </Box>
    )
  }
  return (
    <Stack spacing={3}>
      <OrderSummary subtotal={total} shipping={shipping} />
      {total < FREE_SHIPPING_THRESHOLD && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Add {formatCurrency(FREE_SHIPPING_THRESHOLD - total)} more for free shipping.
        </Alert>
      )}
      <Button variant="contained" size="large" onClick={onNext} fullWidth>
        Continue to shipping
      </Button>
    </Stack>
  )
}

// ─── Step 1 — Shipping address ────────────────────────────────────────────────
function StepShipping({
  values, errors, onChange, onNext, onBack,
}: {
  values: AddressValues
  errors: AddressErrors
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onNext: () => void
  onBack: () => void
}) {
  return (
    <Stack spacing={2} component="form" onSubmit={(e: FormEvent) => { e.preventDefault(); onNext() }} noValidate>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>Shipping address</Typography>
      <TextField
        name="fullName" label="Full name" value={values.fullName}
        onChange={onChange} error={Boolean(errors.fullName)} helperText={errors.fullName}
        required autoComplete="name"
      />
      <TextField
        name="addressLine1" label="Address line 1" value={values.addressLine1}
        onChange={onChange} error={Boolean(errors.addressLine1)} helperText={errors.addressLine1}
        required autoComplete="address-line1"
      />
      <TextField
        name="addressLine2" label="Address line 2 (optional)" value={values.addressLine2}
        onChange={onChange} autoComplete="address-line2"
      />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            name="city" label="City" value={values.city}
            onChange={onChange} error={Boolean(errors.city)} helperText={errors.city}
            required autoComplete="address-level2"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            name="state" label="State / Province" value={values.state}
            onChange={onChange} error={Boolean(errors.state)} helperText={errors.state}
            required autoComplete="address-level1"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            name="postalCode" label="Postal code" value={values.postalCode}
            onChange={onChange} error={Boolean(errors.postalCode)} helperText={errors.postalCode}
            required autoComplete="postal-code"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            name="country" label="Country" value={values.country}
            onChange={onChange} error={Boolean(errors.country)} helperText={errors.country}
            required autoComplete="country"
          />
        </Grid>
      </Grid>
      <Stack direction="row" spacing={1.5} justifyContent="space-between">
        <Button startIcon={<ArrowBackOutlined />} onClick={onBack}>Back</Button>
        <Button type="submit" variant="contained" size="large">Continue to payment</Button>
      </Stack>
    </Stack>
  )
}

// ─── Step 2 — Payment ─────────────────────────────────────────────────────────
function StepPayment({
  values, errors, onChange, onNext, onBack, submitting,
}: {
  values: PaymentValues
  errors: PaymentErrors
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onNext: () => void
  onBack: () => void
  submitting: boolean
}) {
  return (
    <Stack spacing={2} component="form" onSubmit={(e: FormEvent) => { e.preventDefault(); onNext() }} noValidate>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>Payment details</Typography>
      <Alert severity="info" icon={<LockOutlined />} sx={{ borderRadius: 2 }}>
        This is a demo checkout. No real payment is processed and your card will not be charged.
      </Alert>
      <TextField
        name="cardName" label="Name on card" value={values.cardName}
        onChange={onChange} error={Boolean(errors.cardName)} helperText={errors.cardName}
        required autoComplete="cc-name"
      />
      <TextField
        name="cardNumber" label="Card number" value={values.cardNumber}
        onChange={onChange} error={Boolean(errors.cardNumber)} helperText={errors.cardNumber}
        required autoComplete="cc-number" placeholder="1234 5678 9012 3456"
        slotProps={{ htmlInput: { maxLength: 19, inputMode: 'numeric' } }}
      />
      <Grid container spacing={2}>
        <Grid size={{ xs: 6 }}>
          <TextField
            name="expiry" label="Expiry (MM/YY)" value={values.expiry}
            onChange={onChange} error={Boolean(errors.expiry)} helperText={errors.expiry}
            required autoComplete="cc-exp" placeholder="MM/YY"
            slotProps={{ htmlInput: { maxLength: 5, inputMode: 'numeric' } }}
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <TextField
            name="cvv" label="CVV" value={values.cvv}
            onChange={onChange} error={Boolean(errors.cvv)} helperText={errors.cvv}
            required autoComplete="cc-csc" placeholder="123"
            slotProps={{ htmlInput: { maxLength: 4, inputMode: 'numeric' } }}
          />
        </Grid>
      </Grid>
      <Stack direction="row" spacing={1.5} justifyContent="space-between">
        <Button startIcon={<ArrowBackOutlined />} onClick={onBack} disabled={submitting}>Back</Button>
        <Button type="submit" variant="contained" size="large" disabled={submitting}>
          {submitting ? 'Placing order…' : 'Place order'}
        </Button>
      </Stack>
    </Stack>
  )
}

// ─── Step 3 — Confirmation ────────────────────────────────────────────────────
function StepConfirmation({ orderId }: { orderId: string }) {
  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <CheckCircleOutlineOutlined sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Order placed!</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Thank you for your order. Your confirmation number is:
      </Typography>
      <Chip
        label={orderId}
        sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem', px: 1, mb: 3 }}
      />
      <Stack spacing={1.5} direction={{ xs: 'column', sm: 'row' }} justifyContent="center">
        <Button component={Link} to={PATHS.accountOrders} variant="contained">
          View my orders
        </Button>
        <Button component={Link} to={PATHS.products} variant="outlined">
          Continue shopping
        </Button>
      </Stack>
    </Box>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const { user } = useAuth()
  const { items, total, clearCart } = useCart()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [address, setAddress] = useState<AddressValues>({
    ...EMPTY_ADDRESS,
    fullName: user?.name ?? '',
  })
  const [addressErrors, setAddressErrors] = useState<AddressErrors>({})
  const [payment, setPayment] = useState<PaymentValues>(EMPTY_PAYMENT)
  const [paymentErrors, setPaymentErrors] = useState<PaymentErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null)

  const shipping = total >= FREE_SHIPPING_THRESHOLD ? 0 : 5.99

  function handleAddressChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setAddress((prev) => ({ ...prev, [name]: value }))
    setAddressErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  function handlePaymentChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    let formatted = value
    if (name === 'cardNumber') formatted = formatCardNumber(value)
    if (name === 'expiry') formatted = formatExpiry(value)
    if (name === 'cvv') formatted = value.replace(/\D/g, '').slice(0, 4)
    setPayment((prev) => ({ ...prev, [name]: formatted }))
    setPaymentErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  function goToShipping() {
    setStep(1)
  }

  function validateAndGoToPayment() {
    const errs = validateAddress(address)
    setAddressErrors(errs)
    if (Object.keys(errs).length === 0) setStep(2)
  }

  async function submitOrder() {
    const errs = validatePayment(payment)
    setPaymentErrors(errs)
    if (Object.keys(errs).length > 0) return

    if (!user) { navigate(PATHS.login); return }

    setSubmitting(true)
    setSubmitError(null)
    try {
      const orderAddress: OrderAddress = {
        fullName: address.fullName,
        addressLine1: address.addressLine1,
        ...(address.addressLine2 ? { addressLine2: address.addressLine2 } : {}),
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
      }
      const order = await ordersService.create({
        userId: user.id,
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          qty: i.qty,
          image: i.image,
        })),
        subtotal: total,
        shippingCost: shipping,
        total: total + shipping,
        address: orderAddress,
      })
      clearCart()
      setConfirmedOrderId(order.id)
      setStep(3)
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Failed to place order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
        Checkout
      </Typography>

      <Stepper activeStep={step} sx={{ mb: 4 }} alternativeLabel>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {submitError && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Main step content */}
        <Grid size={{ xs: 12, md: step === 3 ? 12 : 7 }}>
          {step === 0 && <StepReview onNext={goToShipping} />}
          {step === 1 && (
            <StepShipping
              values={address}
              errors={addressErrors}
              onChange={handleAddressChange}
              onNext={validateAndGoToPayment}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && (
            <StepPayment
              values={payment}
              errors={paymentErrors}
              onChange={handlePaymentChange}
              onNext={() => void submitOrder()}
              onBack={() => setStep(1)}
              submitting={submitting}
            />
          )}
          {step === 3 && confirmedOrderId && (
            <StepConfirmation orderId={confirmedOrderId} />
          )}
        </Grid>

        {/* Order summary sidebar (hidden on confirmation) */}
        {step < 3 && (
          <Grid size={{ xs: 12, md: 5 }}>
            {submitting ? (
              <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
            ) : (
              <OrderSummary subtotal={total} shipping={shipping} />
            )}
          </Grid>
        )}
      </Grid>
    </Container>
  )
}
