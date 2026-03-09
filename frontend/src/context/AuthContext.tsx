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
  logout: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const applySession = (nextToken: string, nextUser: User) => {
    setToken(nextToken)
    setAccessToken(nextToken)
    setUser(nextUser)
  }

  const clearSession = () => {
    setToken(null)
    setAccessToken(null)
    setUser(null)
  }

  const checkPendingBookings = async () => {
    try {
      const bookings = await bookingService.getMyBookings()
      const pending = bookings.filter(b => b.status === 'pending_payment')
      if (pending.length > 0) {
        toast(`คุณมีรายการจองที่ยังไม่ได้ชำระเงิน ${pending.length} รายการ กรุณาดำเนินการชำระเงินให้เสร็จสิ้น`, {
          duration: 6000,
          icon: '⚠️',
        })
      }
    } catch {
      // Ignore pending-booking checks when the session is not available.
    }
  }

  useEffect(() => {
    authService.refresh()
      .then((data) => {
        applySession(data.access_token, data.user)
        setTimeout(() => void checkPendingBookings(), 500)
      })
      .catch(() => {
        clearSession()
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = async (email: string, password: string, remember: boolean = false) => {
    const data = await authService.login({ email, password, rememberMe: remember })
    applySession(data.access_token, data.user)
    setTimeout(() => void checkPendingBookings(), 500)
    return data.user
  }

  const register = async (name: string, email: string, phone: string, password: string) => {
    const data = await authService.register({ name, email, phone, password })
    applySession(data.access_token, data.user)
    return data.user
  }

  const logout = async () => {
    clearSession()
    try {
      await authService.logout()
    } catch {
      // Ignore network errors during logout; the client session is already cleared.
    }
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
