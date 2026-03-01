import api from './api'
import type { User } from '../types/user'

interface LoginDto {
  email: string
  password: string
  rememberMe?: boolean // ✅ ส่งค่า "จดจำฉัน" ไป backend
}

interface RegisterDto {
  name: string
  email: string
  phone: string
  password: string
}

// ✅ Response ไม่มี refresh_token แล้ว (backend เก็บใน cookie แทน)
interface AuthResponse {
  access_token: string
  user: User
}

export const authService = {
  // ✅ ส่ง rememberMe ไปด้วยเพื่อให้ backend ตั้ง cookie
  login: (data: LoginDto) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  register: (data: RegisterDto) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  getMe: () =>
    api.get<User>('/auth/me').then((r) => r.data),

  // ✅ ไม่ต้องส่ง token ใน body — cookie แนบไปให้อัตโนมัติ
  refresh: () =>
    api.post<AuthResponse>('/auth/refresh').then((r) => r.data),

  // ✅ เรียก backend ลบ cookie
  logout: () =>
    api.post('/auth/logout').then((r) => r.data),
}
