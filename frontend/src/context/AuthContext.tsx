import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '../types/user'
import { authService } from '../services/authService'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string, remember?: boolean) => Promise<void>
  register: (name: string, email: string, phone: string, password: string) => Promise<void>
  logout: () => void
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // โหลดข้อมูล user จาก localStorage ตอนเปิดแอปครั้งแรก
  useEffect(() => {
    const savedToken = localStorage.getItem('token') || sessionStorage.getItem('token')
    const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user')

    if (savedToken && savedUser) {
      authService.getMe() // ยิงเช็คว่า Token ยังไม่หมดอายุ
        .then(() => {
          setToken(savedToken)
          setUser(JSON.parse(savedUser))
        })
        .catch(() => logout()) // ถ้า error (หมดอายุ) ให้เคลียร์ทิ้ง
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string, remember: boolean = false) => {
    const data = await authService.login({ email, password })
    setToken(data.access_token)
    setUser(data.user)

    // ถ้าติ๊ก remember เก็บ localStorage ถ้าไม่ติ๊กเก็บ sessionStorage (ปิดแท็บแล้วหาย)
    const storage = remember ? localStorage : sessionStorage
    storage.setItem('token', data.access_token)
    storage.setItem('user', JSON.stringify(data.user))
  }

  const register = async (name: string, email: string, phone: string, password: string) => {
    const data = await authService.register({ name, email, phone, password })
    setToken(data.access_token)
    setUser(data.user)
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  // เคลียร์ storage ให้ครบทั้ง 2 ที่ตอน logout
  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
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
