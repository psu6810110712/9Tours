import api, { requestSessionRefresh, type SessionRefreshResponse } from './api'
import { API_BASE_URL } from './apiBaseUrl'
import type { User } from '../types/user'

interface LoginDto {
  email: string
  password: string
  rememberMe?: boolean
}

interface RegisterDto {
  name: string
  email: string
  phone: string
  password: string
}

interface AuthResponse {
  access_token: string
  user: User
}

interface RefreshOptions {
  silent?: boolean
}

export const authService = {
  login: (data: LoginDto) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  register: (data: RegisterDto) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  getMe: () =>
    api.get<User>('/auth/me').then((r) => r.data),

  refresh: (options: RefreshOptions = {}) =>
    requestSessionRefresh({ emitAuthExpired: !options.silent }) as Promise<SessionRefreshResponse>,

  logout: () =>
    api.post('/auth/logout').then((r) => r.data),

  loginWithGoogle: () => {
    window.location.assign(`${API_BASE_URL}/auth/google`)
  },
}
