// ─── Validated environment access ────────────────────────────────────────────
// All import.meta.env reads go through this module only.
//
//   VITE_API_BASE_URL  Laravel API root, e.g. http://localhost:9000/api/v1
//   VITE_REVERB_*      Reverb WebSocket server as seen from the BROWSER (localhost:8080)

const apiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:9000/api/v1'

export const env = {
  apiBaseUrl,
  reverb: {
    key: (import.meta.env.VITE_REVERB_APP_KEY as string | undefined) ?? 'ecommerce-local-key',
    host: (import.meta.env.VITE_REVERB_HOST as string | undefined) ?? 'localhost',
    port: Number((import.meta.env.VITE_REVERB_PORT as string | undefined) ?? 8080),
    scheme: (import.meta.env.VITE_REVERB_SCHEME as string | undefined) ?? 'http',
  },
  isDev: import.meta.env.DEV,
} as const

export type Env = typeof env
