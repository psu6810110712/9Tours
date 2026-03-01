import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '../types/user'
import { authService } from '../services/authService'
import { setAccessToken } from '../services/api'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string, remember?: boolean) => Promise<User>
  register: (name: string, email: string, phone: string, password: string) => Promise<User>
  logout: () => void
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // ✅ เปิดแอปครั้งแรก → เรียก /auth/refresh เพื่อ restore session
  // cookie (refresh_token) จะถูกส่งไปอัตโนมัติ
  useEffect(() => {
    authService.refresh()
      .then((data) => {
        setToken(data.access_token)
        setAccessToken(data.access_token) // sync กับ api.ts interceptor
        setUser(data.user)
      })
      .catch(() => {
        // ✅ ไม่มี cookie = ยังไม่ได้ login → ไม่ต้องทำอะไร
      })
      .finally(() => setIsLoading(false))
  }, [])

  // ✅ login — ส่ง rememberMe ไป backend เพื่อตั้งค่า cookie
  const login = async (email: string, password: string, remember: boolean = false) => {
    const data = await authService.login({ email, password, rememberMe: remember })
    setToken(data.access_token)
    setAccessToken(data.access_token)
    setUser(data.user)
    return data.user
  }

  const register = async (name: string, email: string, phone: string, password: string) => {
    const data = await authService.register({ name, email, phone, password })
    setToken(data.access_token)
    setAccessToken(data.access_token)
    setUser(data.user)
    return data.user
  }

  // ✅ logout — เรียก backend ลบ cookie + เคลียร์ state ใน memory
  const logout = () => {
    authService.logout().catch(() => { })
    setToken(null)
    setAccessToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user, token, isLoading,
      login, register, logout,
      isAdmin: user?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth ต้องใช้ภายใน AuthProvider')
  return ctx
}
