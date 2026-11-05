import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'

import RootLayout from '@/app/layouts/RootLayout'
import AuthLayout from '@/app/layouts/AuthLayout'
import AdminLayout from '@/features/admin/layouts/AdminLayout'
import AdminRoute from './AdminRoute'
import CustomerRoute from './CustomerRoute'
import ProtectedRoute from './ProtectedRoute'
import RouteError from '@/app/components/RouteError'
import PageNotFound from '@/app/components/PageNotFound'
import { PATHS } from '@/shared/config/paths'


// Public / storefront
const HomePage = lazy(() => import('@/features/home/pages/HomePage'))
const ProductsPage = lazy(() => import('@/features/products/pages/ProductsPage'))
const ProductDetailPage = lazy(() => import('@/features/products/pages/ProductDetailPage'))

// Auth
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'))

// Admin
const AdminDashboardPage = lazy(() => import('@/features/admin/pages/AdminDashboardPage'))
const AdminProductsPage = lazy(() => import('@/features/admin/pages/AdminProductsPage'))
const AdminInventoryPage = lazy(() => import('@/features/admin/pages/AdminInventoryPage'))
const AdminOrdersPage = lazy(() => import('@/features/admin/pages/AdminOrdersPage'))
const AdminUsersPage = lazy(() => import('@/features/admin/pages/AdminUsersPage'))

// Customer
const CustomerDashboardPage = lazy(() => import('@/features/customer/pages/CustomerDashboardPage'))
const CustomerOrdersPage = lazy(() => import('@/features/customer/pages/CustomerOrdersPage'))
const CustomerProfilePage = lazy(() => import('@/features/customer/pages/CustomerProfilePage'))
const CheckoutPage = lazy(() => import('@/features/customer/pages/CheckoutPage'))

// ─── Suspense fallback ────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <Box
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}
      aria-label="Loading page"
      role="status"
    >
      <CircularProgress />
    </Box>
  )
}

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const router = createBrowserRouter([

  // ── Public storefront routes (header + footer + cart drawer) ──────────────
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      { path: PATHS.home, element: withSuspense(<HomePage />) },
      { path: PATHS.products, element: withSuspense(<ProductsPage />) },
      { path: PATHS.productDetail, element: withSuspense(<ProductDetailPage />) },
      { path: '*', element: <PageNotFound /> },
    ],
  },

  // ── Auth pages (centered card layout, no header) ──────────────────────────
  {
    element: <AuthLayout />,
    errorElement: <RouteError />,
    children: [
      { path: PATHS.login, element: withSuspense(<LoginPage />) },
      { path: PATHS.register, element: withSuspense(<RegisterPage />) },
    ],
  },
  {
    element: <AdminRoute />,
    errorElement: <RouteError />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: PATHS.admin, element: withSuspense(<AdminDashboardPage />) },
          { path: PATHS.adminProducts, element: withSuspense(<AdminProductsPage />) },
          { path: PATHS.adminInventory, element: withSuspense(<AdminInventoryPage />) },
          { path: PATHS.adminOrders, element: withSuspense(<AdminOrdersPage />) },
          { path: PATHS.adminUsers, element: withSuspense(<AdminUsersPage />) },
        ],
      },
    ],
  },

  // ── Legacy /users route (kept for backward compatibility, requires auth) ──
  {
    element: <ProtectedRoute />,
    errorElement: <RouteError />,
    children: [
      {
        element: <RootLayout />,
        children: [{ path: PATHS.users, element: withSuspense(<AdminUsersPage />) }],
      },
    ],
  },
  {
    element: <CustomerRoute />,
    errorElement: <RouteError />,
    children: [
      {
        element: <RootLayout />,
        children: [
          { path: PATHS.account, element: withSuspense(<CustomerDashboardPage />) },
          { path: PATHS.accountOrders, element: withSuspense(<CustomerOrdersPage />) },
          { path: PATHS.accountProfile, element: withSuspense(<CustomerProfilePage />) },
          { path: PATHS.checkout, element: withSuspense(<CheckoutPage />) },
        ],
      },
    ],
  },
])
