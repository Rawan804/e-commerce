import { useState } from 'react'
import {
    Alert,
    Box,
    Button,
    Chip,
    Container,
    Divider,
    Grid,
    Paper,
    Stack,
    Step,
    StepLabel,
    Stepper,
    Typography,
} from '@mui/material'
import CheckCircleOutlineOutlined from '@mui/icons-material/CheckCircleOutlineOutlined'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { useCart } from '@/features/cart'
import { isOrderServerError, orderErrorMessage, ordersService } from '@/features/orders'
import { formatCurrency } from '@/shared/lib/formatters'
import { PATHS } from '@/shared/config/paths'
import ProductImage from '@/features/products/components/ProductImage'

const STEPS = ['Review order', 'Confirmation']
const UNCERTAIN_ORDER_KEY = 'order_submission_outcome_unknown'

function OrderSummary() {
    const { items, total } = useCart()

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
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontWeight: 700 }}>Order total</Typography>
                <Typography sx={{ fontWeight: 700 }}>{formatCurrency(total)}</Typography>
            </Box>
        </Paper>
    )
}

function OrderConfirmation({ orderId }: { orderId: string }) {
    return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleOutlineOutlined sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Order placed</Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
                Your order has been recorded. You can follow its status from your orders page.
            </Typography>
            <Chip label={`Order #${orderId}`} sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem', px: 1, mb: 3 }} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'center' }}>
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

export default function CheckoutPage() {
    const { user } = useAuth()
    const { items, total, clearCart } = useCart()
    const navigate = useNavigate()
    const [step, setStep] = useState(0)
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null)
    const [orderOutcomeUnknown, setOrderOutcomeUnknown] = useState(
        () => sessionStorage.getItem(UNCERTAIN_ORDER_KEY) === 'true',
    )

    async function submitOrder() {
        if (!user) {
            navigate(PATHS.login, { state: { from: PATHS.checkout } })
            return
        }
        if (items.length === 0) return

        setSubmitting(true)
        setSubmitError(null)
        try {
            const order = await ordersService.create({
                items: items.map((item) => ({ productId: item.productId, qty: item.qty })),
            })
            clearCart()
            sessionStorage.removeItem(UNCERTAIN_ORDER_KEY)
            setConfirmedOrderId(order.id)
            setStep(1)
        } catch (error) {
            const uncertain = isOrderServerError(error)
            setOrderOutcomeUnknown(uncertain)
            if (uncertain) sessionStorage.setItem(UNCERTAIN_ORDER_KEY, 'true')
            setSubmitError(orderErrorMessage(
                error,
                'Unable to place your order. Please review the request and try again.',
                'The server returned an error after receiving the order. It may have been saved; check My Orders before attempting another order.',
            ))
        } finally {
            setSubmitting(false)
        }
    }

    function acknowledgeNoOrderFound() {
        sessionStorage.removeItem(UNCERTAIN_ORDER_KEY)
        setOrderOutcomeUnknown(false)
        setSubmitError(null)
    }

    return (
        <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
                Checkout
            </Typography>
            <Stepper activeStep={step} sx={{ mb: 4 }} alternativeLabel>
                {STEPS.map((label) => (
                    <Step key={label}><StepLabel>{label}</StepLabel></Step>
                ))}
            </Stepper>

            {submitError && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => { setSubmitError(null); }}>
                    {submitError}
                </Alert>
            )}

            {step === 1 && confirmedOrderId ? (
                <OrderConfirmation orderId={confirmedOrderId} />
            ) : items.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Your cart is empty.</Typography>
                    <Button component={Link} to={PATHS.products} variant="contained">Browse products</Button>
                </Box>
            ) : (
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Stack spacing={2}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>Review your order</Typography>
                            <Typography color="text.secondary">
                                The total is calculated from current product prices. Stock is reserved when the order is placed.
                            </Typography>
                            <Button variant="contained" size="large" onClick={() => void submitOrder()} disabled={submitting || orderOutcomeUnknown}>
                                {submitting ? 'Placing order…' : `Place order · ${formatCurrency(total)}`}
                            </Button>
                            {orderOutcomeUnknown && (
                                <Stack spacing={1}>
                                    <Button component={Link} to={PATHS.accountOrders} variant="outlined">
                                        Check my orders before retrying
                                    </Button>
                                    <Button onClick={acknowledgeNoOrderFound} size="small">
                                        I checked; no matching order was created
                                    </Button>
                                </Stack>
                            )}
                        </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, md: 5 }}>
                        <OrderSummary />
                    </Grid>
                </Grid>
            )}
        </Container>
    )
}