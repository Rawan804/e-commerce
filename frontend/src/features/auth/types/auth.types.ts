
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
