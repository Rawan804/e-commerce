/**
 * authService
 *
 * Authentication requests against the real Laravel backend.
 *
 * Endpoints used:
 *   POST /auth/login     { email, password }
 *   POST /auth/register  { name, email, password }
 *   GET  /users/me       (Bearer token required)
 *
 * API response envelope:
 *   login / register → { data: { access_token, token_type, user: { id, name, email, role } } }
 *   /users/me        → { data: { id, name, email, role } }
 *
 * Laravel 422 validation errors are surfaced through ApiError.errors so
 * pages can display per-field messages.
 */

import { apiClient } from '@/shared/lib/apiClient'
import type {
  AuthTokenResponse,
  LoginPayload,
  RegisterPayload,
} from '../types/auth.types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toAuthTokenResponse(response: unknown): AuthTokenResponse {
  if (!isRecord(response) || !isRecord(response.data)) {
    throw new Error('The sign-in response was incomplete. Please try again.')
  }

  const data = response.data
  if (typeof data.access_token !== 'string' || data.access_token.trim() === '') {
    throw new Error('The sign-in response did not include an authentication token.')
  }

  return {
    token: data.access_token,
    token_type: 'Bearer',
    user: toAuthUser(data.user),
  }
}

function toAuthUser(value: unknown): AuthTokenResponse['user'] {
  if (!isRecord(value)) {
    throw new Error('The sign-in response did not include a valid user. Please try again.')
  }

  const { id, name, email, role } = value
  if (
    typeof id !== 'number'
    || !Number.isSafeInteger(id)
    || id < 1
    || typeof name !== 'string'
    || typeof email !== 'string'
    || (role !== 'admin' && role !== 'customer')
  ) {
    throw new Error('The sign-in response contained invalid user information. Please try again.')
  }

  return {
    id,
    name,
    email,
    role,
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * POST /auth/login
 * Throws an ApiError on failure (401 = invalid credentials, 422 = validation).
 */
async function login(payload: LoginPayload): Promise<AuthTokenResponse> {
  const response = await apiClient.post<unknown>('/auth/login', {
    email: payload.email,
    password: payload.password,
  })
  return toAuthTokenResponse(response)
}

/**
 * POST /auth/register
 * Sends { name, email, password }.
 * Throws an ApiError on failure (422 = validation errors).
 */
async function register(payload: RegisterPayload): Promise<AuthTokenResponse> {
  const response = await apiClient.post<unknown>('/auth/register', {
    name: payload.username,
    email: payload.email,
    password: payload.password,
  })
  return toAuthTokenResponse(response)
}

/**
 * GET /users/me
 * Fetches the authenticated user from the backend using the stored Bearer token.
 * Called during app startup (token rehydration) and after login/register.
 * Throws ApiError with status 401 if the token is missing or expired.
 */
async function fetchMe(): Promise<AuthTokenResponse['user']> {
  const response = await apiClient.get<unknown>('/users/me')
  if (!isRecord(response) || !('data' in response)) {
    throw new Error('The user profile response was incomplete.')
  }
  return toAuthUser(response.data)
}

/**
 * Best-effort server-side logout. Client session is cleared regardless.
 */
async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout')
  } catch {
    /* ignore — client-side session is cleared regardless */
  }
}

export const authService = { login, register, fetchMe, logout } as const
