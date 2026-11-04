
import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  isAxiosError,
} from 'axios'
import { env } from '@/shared/config/env'
import type { ApiError } from '@/shared/types/api.types'


const TOKEN_KEY = 'auth_token'
const getToken = (): string | null => localStorage.getItem(TOKEN_KEY)


const instance: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: 15_000,
})


instance.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})


function normaliseError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    const status = error.response?.status ?? null

    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined

    const apiError: ApiError = {
      message:
        data?.message ??
        error.message ??
        'An unexpected error occurred.',
      status,
    }
  
    if (data?.errors) {
      apiError.errors = data.errors
    }
    return apiError
  }


  if (error instanceof Error) {
    return { message: error.message, status: null }
  }

  return { message: 'An unknown error occurred.', status: null }
}

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
