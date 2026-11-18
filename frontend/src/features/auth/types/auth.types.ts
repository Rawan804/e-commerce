// ─── Auth domain types ────────────────────────────────────────────────────────
// These are the shapes Phase 5 will flesh out once the Laravel API contract
// is confirmed. They live here so the router and ProtectedRoute can reference
// them without depending on the full auth feature implementation.

export interface AuthUser {
  id: number
  name: string
  email: string
  role: 'admin' | 'customer'
}

export interface AuthState {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  /** Display/handle name shown in the UI and sent as Laravel's `name`. */
  username: string
  email: string
  password: string
  password_confirmation: string
}

export interface AuthTokenResponse {
  token: string
  token_type: 'Bearer'
  user: AuthUser
}

// ─── Real API response shapes ─────────────────────────────────────────────────
// The Laravel backend wraps all responses in a { data: ... } envelope.

/** User object returned inside data by login / register / GET /users/me */
export interface ApiUserData {
  id: number
  name: string
  email: string
  role: 'admin' | 'customer'
}

/** Envelope returned by POST /auth/login and POST /auth/register */
export interface ApiAuthResponse {
  data: {
    access_token: string
    token_type: string
    user: ApiUserData
  }
}

/** Envelope returned by GET /users/me */
export interface ApiMeResponse {
  data: ApiUserData
}
