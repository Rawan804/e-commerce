import { PATHS } from './paths'

export interface NavItem {
  label: string
  path: string
  /** When true, item is only shown to authenticated users */
  authRequired?: boolean
  /** When set, item is only shown to users with this specific role */
  role?: 'admin' | 'customer'
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', path: PATHS.home },
  { label: 'Products', path: PATHS.products },
]

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: PATHS.admin, role: 'admin' },
  { label: 'Products', path: PATHS.adminProducts, role: 'admin' },
  { label: 'Inventory', path: PATHS.adminInventory, role: 'admin' },
  { label: 'Orders', path: PATHS.adminOrders, role: 'admin' },
  { label: 'Users', path: PATHS.adminUsers, role: 'admin' },
]

export const CUSTOMER_NAV_ITEMS: NavItem[] = [
  { label: 'My Account', path: PATHS.account, role: 'customer', authRequired: true },
  { label: 'My Orders', path: PATHS.accountOrders, role: 'customer', authRequired: true },
  { label: 'My Profile', path: PATHS.accountProfile, role: 'customer', authRequired: true },
]
