import api, { requestSessionRefresh, type SessionRefreshResponse } from './api'
import { API_BASE_URL } from './apiBaseUrl'
import type { User } from '../types/user'
import type { CustomerPrefix } from '../utils/profileValidation'

const OAUTH_RETURN_TO_KEY = 'google_oauth_return_to'

interface LoginDto {
  identifier: string
  password: string
  rememberMe?: boolean
}

interface RegisterDto {
  prefix: CustomerPrefix
  name: string
  email: string
  phone: string
  password: string
}

interface UpdateOwnProfileDto {
  prefix: CustomerPrefix
  name: string
  email: string
  phone: string
}

interface AuthResponse {
  access_token: string
  user: User
}

interface RefreshOptions {
  silent?: boolean
}

function getCurrentReturnTo() {
  if (typeof window === 'undefined') {
    return '/'
  }

  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

export function consumeOAuthReturnTo() {
  if (typeof window === 'undefined') {
    return '/'
  }

  const stored = window.sessionStorage.getItem(OAUTH_RETURN_TO_KEY) || '/'
  window.sessionStorage.removeItem(OAUTH_RETURN_TO_KEY)
  return stored
}

export function clearOAuthReturnTo() {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.removeItem(OAUTH_RETURN_TO_KEY)
}

export const authService = {
  login: (data: LoginDto) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  register: (data: RegisterDto) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  getMe: () =>
    api.get<User>('/auth/me').then((r) => r.data),

  updateOwnProfile: (data: UpdateOwnProfileDto) =>
    api.patch<User>('/users/me', data).then((r) => r.data),

  refresh: (options: RefreshOptions = {}) =>
    requestSessionRefresh({ emitAuthExpired: !options.silent }) as Promise<SessionRefreshResponse>,

  logout: () =>
    api.post('/auth/logout').then((r) => r.data),

  loginWithGoogle: (returnTo?: string) => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(OAUTH_RETURN_TO_KEY, returnTo ?? getCurrentReturnTo())
    }
    window.location.assign(`${API_BASE_URL}/auth/google`)
  },
}
