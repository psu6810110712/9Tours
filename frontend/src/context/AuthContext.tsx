import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '../types/user'
import { authService } from '../services/authService'

interface AuthContextType {
  user: User | null
  token: string | null
  refreshToken: string | null
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
  const [refreshToken, setRefreshToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // โหลดข้อมูล user จาก localStorage ตอนเปิดแอปครั้งแรก
  useEffect(() => {
    const savedToken = localStorage.getItem('token') || sessionStorage.getItem('token')
    const savedRefreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token')
    const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setRefreshToken(savedRefreshToken)
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string, remember: boolean = false) => {
    const data = await authService.login({ email, password })
    setToken(data.access_token)
    setRefreshToken(data.refresh_token)
    setUser(data.user)

    if (remember) {
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      localStorage.setItem('user', JSON.stringify(data.user))
    } else {
      sessionStorage.setItem('token', data.access_token)
      sessionStorage.setItem('refresh_token', data.refresh_token)
      sessionStorage.setItem('user', JSON.stringify(data.user))
    }

    return data.user
  }

  const register = async (name: string, email: string, phone: string, password: string) => {
    const data = await authService.register({ name, email, phone, password })
    setToken(data.access_token)
    setRefreshToken(data.refresh_token)
    setUser(data.user)
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data.user
  }

  // เคลียร์ storage ให้ครบทั้ง 2 ที่ตอน logout
  const logout = () => {
    setToken(null)
    setRefreshToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{
      user, token, refreshToken, isLoading,
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
