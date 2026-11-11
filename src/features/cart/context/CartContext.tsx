import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { Product } from '@/features/products/types/product.types'

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CartItem {
  productId: number
  name: string
  price: number
  image: string
  stock: number | null
  qty: number
}

interface CartContextValue {
  items: CartItem[]
  /** Total number of units in the cart. */
  count: number
  /** Sum of price * qty across all items, in major currency units. */
  total: number
  isCartOpen: boolean
  addItem: (product: Product, qty?: number) => void
  updateQty: (productId: number, qty: number) => void
  removeItem: (productId: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

// ─── Persistence ───────────────────────────────────────────────────────────────
const STORAGE_KEY = 'cart_items'

function readStoredItems(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

// ─── Provider ──────────────────────────────────────────────────────────────────
interface CartProviderProps {
  children: ReactNode
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>(() => readStoredItems())
  const [isCartOpen, setCartOpen] = useState(false)

  // Keep cart in sync with localStorage so it survives a refresh.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = useCallback((product: Product, qty = 1) => {
    if (product.stock === 0) return
    const requestedQty = Math.max(1, Math.min(100, Math.trunc(qty)))
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        // Never exceed available stock.
        const nextQty = product.stock === null
          ? Math.min(existing.qty + requestedQty, 100)
          : Math.min(existing.qty + requestedQty, product.stock, 100)
        return prev.map((i) =>
          i.productId === product.id ? { ...i, qty: nextQty } : i,
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          stock: product.stock,
          qty: product.stock === null ? requestedQty : Math.min(requestedQty, product.stock),
        },
      ]
    })
    setCartOpen(true)
  }, [])

  const updateQty = useCallback((productId: number, qty: number) => {
    setItems((prev) =>
      prev
        .map((i) =>
          i.productId === productId
            ? { ...i, qty: Math.max(0, i.stock === null ? Math.min(qty, 100) : Math.min(qty, i.stock, 100)) }
            : i,
        )
        .filter((i) => i.qty > 0),
    )
  }, [])

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }, [])

  const clearCart = useCallback(() => { setItems([]); }, [])
  const openCart = useCallback(() => { setCartOpen(true); }, [])
  const closeCart = useCallback(() => { setCartOpen(false); }, [])

  const { count, total } = useMemo(() => {
    return items.reduce(
      (acc, i) => {
        acc.count += i.qty
        acc.total += i.qty * i.price
        return acc
      },
      { count: 0, total: 0 },
    )
  }, [items])

  const value: CartContextValue = {
    items,
    count,
    total,
    isCartOpen,
    addItem,
    updateQty,
    removeItem,
    clearCart,
    openCart,
    closeCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useCartContext(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
