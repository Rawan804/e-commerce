// Public API for the cart feature.
// Other features and app/ code import from here only — never from internals.
export { CartProvider } from './context/CartContext'
export { useCart } from './hooks/useCart'
export type { CartItem } from './context/CartContext'
