export { default as AdminLayout } from './layouts/AdminLayout'

// Pages (lazy-loaded in router.tsx — re-exported here for discoverability)
export { default as AdminDashboardPage } from './pages/AdminDashboardPage'
export { default as AdminProductsPage } from './pages/AdminProductsPage'
export { default as AdminInventoryPage } from './pages/AdminInventoryPage'
export { default as AdminOrdersPage } from './pages/AdminOrdersPage'
export { default as AdminUsersPage } from './pages/AdminUsersPage'

// Shared admin components
export { default as StatCard } from './components/StatCard'
export { default as OrderStatusChip } from './components/OrderStatusChip'
export { default as OrderStatusDialog } from './components/OrderStatusDialog'
export { default as ImageUploadField } from './components/ImageUploadField'
