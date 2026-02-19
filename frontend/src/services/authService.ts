import api from './api'
import type { User } from '../types/user'

interface LoginDto {
  email: string
  password: string
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

export const authService = {
  login: (data: LoginDto) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  register: (data: RegisterDto) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  getMe: () =>
    api.get<User>('/auth/me').then((r) => r.data),
}
