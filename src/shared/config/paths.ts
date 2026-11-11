// ─── Route path constants ─────────────────────────────────────────────────────
// Single source of truth for every URL in the app.
// The router, nav items, Link components, and redirects all import from here.
// Never hard-code a path string anywhere else.

export const PATHS = {
  home: '/',

  products: '/products',
  productDetail: '/products/:id',
  productCreate: '/products/new',
  productEdit: '/products/:id/edit',

  login: '/login',
  register: '/register',

  users: '/users',

  // ── Admin area ──────────────────────────────────────────────────────────────
  admin: '/admin',
  adminProducts: '/admin/products',
  adminInventory: '/admin/inventory',
  adminOrders: '/admin/orders',
  adminUsers: '/admin/users',

  // ── Customer area ───────────────────────────────────────────────────────────
  account: '/account',
  accountOrders: '/account/orders',
  accountProfile: '/account/profile',

  // ── Checkout ─────────────────────────────────────────────────────────────────
  checkout: '/checkout',
} as const

// Helper: builds a concrete URL from a parameterised path.
// Usage: buildPath(PATHS.productDetail, { id: '42' }) → '/products/42'
export function buildPath(
  pattern: string,
  params: Record<string, string>,
): string {
  return Object.entries(params).reduce(
    (acc, [key, val]) => acc.replace(`:${key}`, val),
    pattern,
  )
}
