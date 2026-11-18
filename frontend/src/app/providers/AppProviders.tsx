import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import type { ReactNode } from 'react'
import { theme } from '@/shared/theme/theme'
import { AuthProvider } from '@/features/auth'
import { CartProvider } from '@/features/cart'

interface AppProvidersProps {
  children: ReactNode
}

// ─── AppProviders ─────────────────────────────────────────────────────────────
// Wraps the entire application with global context providers.
// Order matters:
//   ThemeProvider → must be outermost so all MUI components can read the theme.
//   CssBaseline   → normalises browser default styles (like a CSS reset).
//   AuthProvider  → makes auth state available to every component.
//   CartProvider  → makes the shopping cart available to every component.
export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
