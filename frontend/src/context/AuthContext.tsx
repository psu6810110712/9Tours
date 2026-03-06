import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '../types/user'
import { authService } from '../services/authService'
import { bookingService } from '../services/bookingService'
import { setAccessToken } from '../services/api'
import { toast } from 'react-hot-toast'

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

  // ตรวจสอบว่ามี booking ค้างชำระเงินหรือไม่ แล้วแจ้งลูกค้า
  const checkPendingBookings = async () => {
    try {
      const bookings = await bookingService.getMyBookings()
      const pending = bookings.filter(b => b.status === 'pending_payment')
      if (pending.length > 0) {
        toast(`คุณมีรายการจองที่ยังไม่ได้ชำระเงิน`, {
          duration: 6000,
          icon: '⚠️',
        })
      }
    } catch { /* ignore */ }
  }

  // เปิดแอปครั้งแรก → เรียก /auth/refresh เพื่อ restore session
  // cookie (refresh_token) จะถูกส่งไปอัตโนมัติ
  useEffect(() => {
    authService.refresh()
      .then((data) => {
        setToken(data.access_token)
        setAccessToken(data.access_token)
        setUser(data.user)
        // ตรวจสอบ booking ค้างหลัง restore session สำเร็จ
        setTimeout(() => checkPendingBookings(), 500)
      })
      .catch(() => {
        // ไม่มี cookie = ยังไม่ได้ login → ไม่ต้องทำอะไร
      })
      .finally(() => setIsLoading(false))
  }, [])

  // login — ส่ง rememberMe ไป backend เพื่อตั้งค่า cookie
  const login = async (email: string, password: string, remember: boolean = false) => {
    const data = await authService.login({ email, password, rememberMe: remember })
    setToken(data.access_token)
    setAccessToken(data.access_token)
    setUser(data.user)
    // ตรวจสอบ booking ค้างหลัง login สำเร็จ
    setTimeout(() => checkPendingBookings(), 500)
    return data.user
  }

  const register = async (name: string, email: string, phone: string, password: string) => {
    const data = await authService.register({ name, email, phone, password })
    setToken(data.access_token)
    setAccessToken(data.access_token)
    setUser(data.user)
    return data.user
  }

  // logout — เรียก backend ลบ cookie + เคลียร์ state ใน memory
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

// ⚠️ แยก export ออกมาหรือทำ default export ไม่ให้ Vite HMR แจ้งเตือน
// Fast Refresh requires a file to only export React components or hook 
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth ต้องใช้ภายใน AuthProvider')
  return ctx
}
