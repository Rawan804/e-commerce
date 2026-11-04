
const apiBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000/api'

export const env = {
  apiBaseUrl,
  useMock: (import.meta.env.VITE_USE_MOCK as string | undefined) !== 'false',
} as const

export type Env = typeof env
