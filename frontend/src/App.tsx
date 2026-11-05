import { RouterProvider } from 'react-router-dom'
import AppProviders from '@/app/providers/AppProviders'
import { router } from '@/app/router/router'

// App is intentionally thin — just wires providers around the router.
// Every feature and layout decision lives one level down.
export default function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  )
}
