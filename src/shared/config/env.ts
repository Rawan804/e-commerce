// ─── Validated environment access ────────────────────────────────────────────
// All import.meta.env reads go through this module only.
//
//   VITE_API_BASE_URL  Laravel API root, e.g. http://localhost:9000/api/v1

const apiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:9000/api/v1'

export const env = {
  apiBaseUrl,
  isDev: import.meta.env.DEV,
} as const

export type Env = typeof env
