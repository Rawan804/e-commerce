/**
 * shared/lib/apiClient.ts
 *
 * The only place in the app that calls Axios directly.
 * Every feature service imports `apiClient` from here and calls its methods.
 *
 * Responsibilities:
 *   • Sets the base URL from env.ts (validated at startup).
 *   • Attaches the Bearer token from localStorage on every request.
 *   • Normalises all errors into a typed ApiError so callers get a consistent shape.
 *   • Handles Laravel 422 validation error payloads.
 *   • Supports request cancellation via AbortSignal (passed through to Axios).
 *
 * Why Axios over fetch?
 *   Axios provides interceptors for the token injection and error normalisation
 *   patterns we need, automatic JSON serialisation, and a cleaner cancellation
 *   API — all without the boilerplate required with raw fetch.
 */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  isAxiosError,
} from 'axios'
import { env } from '@/shared/config/env'
import type { ApiError } from '@/shared/types/api.types'

// ─── Token helpers ────────────────────────────────────────────────────────────
// Must match the TOKEN_KEY used in AuthContext so the client always reads the
// most-recent token, including after a page refresh.
const TOKEN_KEY = 'auth_token'
const getToken = (): string | null => localStorage.getItem(TOKEN_KEY)

// ─── Axios instance ───────────────────────────────────────────────────────────
const instance: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { Accept: 'application/json' },
  timeout: 15_000,
})

let refreshRequest: Promise<string | null> | null = null

// ─── Request interceptor — attach auth token ──────────────────────────────────
instance.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

instance.interceptors.response.use(undefined, async (error: unknown) => {
  if (!isAxiosError(error) || error.response?.status !== 401 || !error.config) {
    return Promise.reject(normaliseError(error))
  }

  const config = error.config as typeof error.config & { authRetry?: boolean }
  const isAuthEndpoint = /\/auth\/(login|register|refresh|logout)(?:\?|$)/.test(config.url ?? '')
  const token = getToken()

  if (config.authRetry || isAuthEndpoint || !token) {
    return Promise.reject(normaliseError(error))
  }

  config.authRetry = true
  refreshRequest ??= axios
    .post<{ data?: { access_token?: string } }>(
      `${env.apiBaseUrl}/auth/refresh`,
      {},
      {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        timeout: 15_000,
      },
    )
    .then(({ data }) => {
      const refreshedToken = data.data?.access_token
      if (!refreshedToken) throw new Error('The refresh response did not include an access token.')
      localStorage.setItem(TOKEN_KEY, refreshedToken)
      window.dispatchEvent(new CustomEvent('auth:token-refreshed', { detail: refreshedToken }))
      return refreshedToken
    })
    .catch(() => {
      localStorage.removeItem(TOKEN_KEY)
      window.dispatchEvent(new Event('auth:expired'))
      return null
    })
    .finally(() => {
      refreshRequest = null
    })

  const refreshedToken = await refreshRequest
  if (!refreshedToken) return Promise.reject(normaliseError(error))

  config.headers.Authorization = `Bearer ${refreshedToken}`
  return instance.request(config)
})

// ─── Error normaliser ─────────────────────────────────────────────────────────
// Converts any Axios error into a flat ApiError that components can display
// without digging into the Axios error structure.
// Laravel returns errors in two shapes:
//   422 validation: { message: string, errors: { field: string[] } }
//   Other API errors: { error: { code: string, message: string, status: number, details?: {...} } }
function normaliseError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    const status = error.response?.status ?? null

    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | { error?: { code?: string; message?: string; status?: number; details?: Record<string, string[]> } }
      | undefined

    // Handle Laravel's custom error envelope: { error: { code, message, status, details? } }
    if (data && 'error' in data && data.error) {
      const apiError: ApiError = {
        message: data.error.message ?? 'An unexpected error occurred.',
        status,
      }
      if (data.error.code) {
        apiError.code = data.error.code
      }
      if (data.error.details) {
        apiError.errors = data.error.details
      }
      return apiError
    }

    // Handle Laravel 422 validation: { message, errors: { field: string[] } }
    const validationData = data as { message?: string; errors?: Record<string, string[]> } | undefined
    const apiError: ApiError = {
      message:
        validationData?.message ??
        error.message ??
        'An unexpected error occurred.',
      status,
    }
    if (validationData?.errors) {
      apiError.errors = validationData.errors
    }
    return apiError
  }

  // Non-Axios error (e.g. thrown manually in a test or service)
  if (error instanceof Error) {
    return { message: error.message, status: null }
  }

  return { message: 'An unknown error occurred.', status: null }
}

// ─── Public typed helpers ─────────────────────────────────────────────────────
// Services call these instead of `instance` directly so they stay type-safe
// and do not need to import Axios themselves.

async function get<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  try {
    const res: AxiosResponse<T> = await instance.get(url, config)
    return res.data
  } catch (err) {
    throw normaliseError(err)
  }
}

async function post<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  try {
    const res: AxiosResponse<T> = await instance.post(url, data, config)
    return res.data
  } catch (err) {
    throw normaliseError(err)
  }
}

async function put<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  try {
    const res: AxiosResponse<T> = await instance.put(url, data, config)
    return res.data
  } catch (err) {
    throw normaliseError(err)
  }
}

async function patch<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  try {
    const res: AxiosResponse<T> = await instance.patch(url, data, config)
    return res.data
  } catch (err) {
    throw normaliseError(err)
  }
}

async function del<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  try {
    const res: AxiosResponse<T> = await instance.delete(url, config)
    return res.data
  } catch (err) {
    throw normaliseError(err)
  }
}

export const apiClient = { get, post, put, patch, delete: del } as const
