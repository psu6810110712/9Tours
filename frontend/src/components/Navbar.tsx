import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoginModal from './LoginModal'
import RegisterModal from './RegisterModal'

const NAV_LINKS = [
  { label: 'หน้าแรก', path: '/' },
  { label: 'วันเดย์ทริป', path: '/tours?tourType=one_day' },
  { label: 'เที่ยวพร้อมที่พัก', path: '/tours?tourType=package' },
]

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [modal, setModal] = useState<'login' | 'register' | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { pathname, search } = location

  const [modalError, setModalError] = useState('')

  useEffect(() => {
    const state = location.state as { requireLogin?: boolean; authExpired?: boolean; oauthError?: string } | null
    if (state?.requireLogin) {
      if (state.oauthError) {
        setModalError(state.oauthError)
      } else if (state.authExpired) {
        setModalError('เซสชันของคุณหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง')
      }
      setModal('login')
      navigate(pathname, { replace: true, state: {} })
    }
  }, [location, navigate, pathname])

  useEffect(() => {
    const handleAuthExpired = () => {
      if (pathname === '/') {
        void logout()
        setModalError('เซสชันของคุณหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง')
        setModal('login')
      } else {
        navigate('/', { replace: true, state: { requireLogin: true, authExpired: true } })
        void logout()
      }
    }

    window.addEventListener('auth:expired', handleAuthExpired as EventListener)

    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired as EventListener)
    }
  }, [logout, navigate, pathname])

  const isActive = (path: string) => {
    const [p, q] = path.split('?')
    if (q) return pathname === p && search.includes(q)
    return pathname === p && !search
  }

  const handleLogout = () => {
    void logout()
    setMenuOpen(false)
    navigate('/')
  }

  const navLinkClass = (path: string) =>
    isActive(path)
      ? 'text-[var(--color-primary)] font-semibold border-b-2 border-[var(--color-primary)] pb-0.5'
      : 'text-gray-500 hover:text-gray-900 transition-colors border-b-2 border-transparent pb-0.5'

  return (
    <>
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-8 h-[68px] flex items-center justify-between gap-8">
          <Link to="/" className="flex-shrink-0">
            <img src="/logo.png" alt="9Tours" className="h-16 w-auto" />
          </Link>

          <div className="hidden md:flex items-center gap-8 text-[15px]">
            {NAV_LINKS.map(({ label, path }) => (
              <Link key={path} to={path} className={navLinkClass(path)}>
                {label}
              </Link>
            ))}
            {isAdmin && (
              <>
                <Link
                  to="/admin/dashboard"
                  className={
                    pathname === '/admin/dashboard'
                      ? 'text-[var(--color-primary)] font-semibold border-b-2 border-[var(--color-primary)] pb-0.5'
                      : 'text-gray-500 hover:text-gray-900 transition-colors border-b-2 border-transparent pb-0.5'
                  }
                >
                  แดชบอร์ด
                </Link>
                <Link
                  to="/admin/tours"
                  className={
                    pathname.startsWith('/admin/tours')
                      ? 'text-[var(--color-primary)] font-semibold border-b-2 border-[var(--color-primary)] pb-0.5'
                      : 'text-gray-500 hover:text-gray-900 transition-colors border-b-2 border-transparent pb-0.5'
                  }
                >
                  จัดการทัวร์
                </Link>
                <Link
                  to="/admin/bookings"
                  className={
                    pathname.startsWith('/admin/bookings')
                      ? 'text-[var(--color-primary)] font-semibold border-b-2 border-[var(--color-primary)] pb-0.5'
                      : 'text-gray-500 hover:text-gray-900 transition-colors border-b-2 border-transparent pb-0.5'
                  }
                >
                  ตรวจสอบสลิป
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-4 ml-auto">
            {user ? (
              <>
                <Link
                  to="/my-bookings"
                  className={`hidden md:block text-[15px] transition-colors ${pathname === '/my-bookings'
                    ? 'text-[var(--color-primary)] font-semibold'
                    : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                  การจองของฉัน
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <span className="w-9 h-9 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center text-sm font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="hidden md:block">{user.name}</span>
                  </button>

                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 text-sm z-20">
                        <hr className="my-1 border-gray-100" />
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2.5 text-red-500 hover:bg-red-50 transition-colors"
                        >
                          ออกจากระบบ
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <button
                onClick={() => {
                  setModalError('')
                  setModal('login')
                }}
                className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                เข้าสู่ระบบ
              </button>
            )}
          </div>
        </div>
      </nav>

      {modal === 'login' && (
        <LoginModal
          onClose={() => {
            setModal(null)
            setModalError('')
          }}
          onSwitchToRegister={() => {
            setModal('register')
            setModalError('')
          }}
          initialError={modalError}
        />
      )}
      {modal === 'register' && (
        <RegisterModal
          onClose={() => setModal(null)}
          onSwitchToLogin={() => {
            setModal('login')
            setModalError('')
          }}
        />
      )}
    </>
  )
}
