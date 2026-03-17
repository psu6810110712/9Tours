import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '../types/user'
import { authService } from '../services/authService'
import { bookingService } from '../services/bookingService'
import { toast } from 'react-hot-toast'
import type { CustomerPrefix } from '../utils/profileValidation'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (identifier: string, password: string, remember?: boolean) => Promise<User>
  register: (prefix: CustomerPrefix, name: string, email: string, phone: string, password: string) => Promise<User>
  updateOwnProfile: (prefix: CustomerPrefix, name: string, email: string, phone: string) => Promise<User>
  refreshCurrentUser: () => Promise<User>
  loginWithGoogle: (returnTo?: string) => void
  completeGoogleLogin: () => Promise<User>
  logout: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)
const AUTH_SESSION_HINT_KEY = 'auth_session_active'

function setSessionHint(active: boolean) {
  if (typeof window === 'undefined') {
    return
  }

  if (active) {
    window.localStorage.setItem(AUTH_SESSION_HINT_KEY, 'true')
    return
  }

  window.localStorage.removeItem(AUTH_SESSION_HINT_KEY)
}

function shouldAttemptSessionRestore() {
  if (typeof window === 'undefined') {
    return false
  }

  return (
    window.location.pathname === '/auth/google/callback'
    || window.localStorage.getItem(AUTH_SESSION_HINT_KEY) === 'true'
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const applyUser = (nextUser: User) => {
    setUser(nextUser)
  }

  const applySession = (nextUser: User) => {
    applyUser(nextUser)
    setSessionHint(true)
  }

  const clearSession = () => {
    setUser(null)
    setSessionHint(false)
  }

  const checkPendingBookings = async () => {
    try {
      const bookings = await bookingService.getMyBookings()
      const pending = bookings.filter(b => b.status === 'pending_payment')
      if (pending.length > 0) {
        toast('คุณมีรายการจองที่ยังไม่ได้ชำระเงิน กรุณาดำเนินการชำระเงินให้เสร็จสิ้น', {
          duration: 6000,
          icon: '⚠️',
        })
      }
    } catch {
      // Ignore pending-booking checks when the session is not available.
    }
  }

  useEffect(() => {
    if (!shouldAttemptSessionRestore()) {
      setIsLoading(false)
      return
    }

    authService.refresh({ silent: true })
      .then((data) => {
        applySession(data.user)
        setTimeout(() => void checkPendingBookings(), 500)
      })
      .catch(() => {
        clearSession()
      })
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    const handleAuthExpired = () => {
      clearSession()
    }

    window.addEventListener('auth:expired', handleAuthExpired)
    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired)
    }
  }, [])

  const refreshCurrentUser = async () => {
    const currentUser = await authService.getMe()
    applyUser(currentUser)
    return currentUser
  }

  const login = async (identifier: string, password: string, remember: boolean = false) => {
    const data = await authService.login({ identifier, password, rememberMe: remember })
    applySession(data.user)
    setTimeout(() => void checkPendingBookings(), 500)
    return data.user
  }

  const register = async (prefix: CustomerPrefix, name: string, email: string, phone: string, password: string) => {
    const data = await authService.register({ prefix, name, email, phone, password })
    applySession(data.user)
    return data.user
  }

  const updateOwnProfile = async (prefix: CustomerPrefix, name: string, email: string, phone: string) => {
    const nextUser = await authService.updateOwnProfile({ prefix, name, email, phone })
    applyUser(nextUser)
    return nextUser
  }

  const loginWithGoogle = (returnTo?: string) => {
    authService.loginWithGoogle(returnTo)
  }

  const completeGoogleLogin = async () => {
    const data = await authService.refresh({ silent: true })
    applySession(data.user)
    setTimeout(() => void checkPendingBookings(), 500)
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
      user, isLoading,
      login, register, updateOwnProfile, refreshCurrentUser,
      loginWithGoogle, completeGoogleLogin, logout,
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
