import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Vite guarantees the element exists because index.html always has <div id="root">.
// The non-null assertion is intentional and safe here.
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = document.getElementById('root')!

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
