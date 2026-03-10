import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoginModal from './LoginModal'
import RegisterModal from './RegisterModal'
import { buildDisplayName } from '../utils/profileValidation'

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

  const displayName = useMemo(() => {
    if (!user) {
      return ''
    }
    return buildDisplayName(user.prefix, user.name) || user.name || user.email || 'ผู้ใช้งาน'
  }, [user])

  const avatarLabel = useMemo(() => {
    const source = displayName || user?.email || 'U'
    return source.charAt(0).toUpperCase()
  }, [displayName, user?.email])

  useEffect(() => {
    const state = location.state as { requireLogin?: boolean; authExpired?: boolean; oauthError?: string } | null
    if (state?.requireLogin) {
      if (state.oauthError) {
        setModalError(state.oauthError)
      } else if (state.authExpired) {
        setModalError('เซสชันของคุณหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง')
      }
      setModal('login')
      navigate(`${pathname}${search}`, { replace: true, state: {} })
    }
  }, [location.state, navigate, pathname, search])

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
    const [targetPath, targetQuery] = path.split('?')
    if (targetQuery) {
      return pathname === targetPath && search.includes(targetQuery)
    }
    return pathname === targetPath && !search
  }

  const handleLogout = () => {
    void logout()
    setMenuOpen(false)
    navigate('/')
  }

  const navLinkClass = (path: string) =>
    isActive(path)
      ? 'border-b-2 border-[var(--color-primary)] pb-0.5 font-semibold text-[var(--color-primary)]'
      : 'border-b-2 border-transparent pb-0.5 text-gray-500 transition-colors hover:text-gray-900'

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-8 px-8">
          <Link to="/" className="flex-shrink-0">
            <img src="/logo.png" alt="9Tours" className="h-16 w-auto" />
          </Link>

          <div className="hidden items-center gap-8 text-[15px] md:flex">
            {NAV_LINKS.map(({ label, path }) => (
              <Link key={path} to={path} className={navLinkClass(path)}>
                {label}
              </Link>
            ))}
            {isAdmin && (
              <>
                <Link to="/admin/dashboard" className={pathname === '/admin/dashboard' ? navLinkClass('/admin/dashboard') : 'border-b-2 border-transparent pb-0.5 text-gray-500 transition-colors hover:text-gray-900'}>
                  แดชบอร์ด
                </Link>
                <Link to="/admin/tours" className={pathname.startsWith('/admin/tours') ? navLinkClass('/admin/tours') : 'border-b-2 border-transparent pb-0.5 text-gray-500 transition-colors hover:text-gray-900'}>
                  จัดการทัวร์
                </Link>
                <Link to="/admin/bookings" className={pathname.startsWith('/admin/bookings') ? navLinkClass('/admin/bookings') : 'border-b-2 border-transparent pb-0.5 text-gray-500 transition-colors hover:text-gray-900'}>
                  ตรวจสอบสลิป
                </Link>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-4">
            {user ? (
              <>
                {user.role === 'customer' && user.profileCompleted ? (
                  <Link
                    to="/my-bookings"
                    className={`hidden text-[15px] transition-colors md:block ${pathname === '/my-bookings' ? 'font-semibold text-[var(--color-primary)]' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    การจองของฉัน
                  </Link>
                ) : null}

                {user.role === 'customer' && !user.profileCompleted ? (
                  <Link
                    to="/auth/complete-profile"
                    className="hidden rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100 md:block"
                  >
                    กรอกข้อมูลให้ครบ
                  </Link>
                ) : null}

                <div className="relative">
                  <button
                    onClick={() => setMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2.5 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-bold text-white">
                      {avatarLabel}
                    </span>
                    <span className="hidden max-w-[14rem] truncate md:block">{displayName}</span>
                  </button>

                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                      <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-gray-100 bg-white py-1.5 text-sm shadow-lg">
                        <div className="border-b border-gray-100 px-4 py-3">
                          <p className="truncate font-semibold text-gray-800">{displayName}</p>
                          <p className="truncate text-xs text-gray-500">{user.email}</p>
                        </div>
                        {user.role === 'customer' && !user.profileCompleted && (
                          <button
                            onClick={() => {
                              setMenuOpen(false)
                              navigate('/auth/complete-profile')
                            }}
                            className="w-full px-4 py-2.5 text-left text-amber-700 transition-colors hover:bg-amber-50"
                          >
                            กรอกข้อมูลให้ครบ
                          </button>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-2.5 text-left text-red-500 transition-colors hover:bg-red-50"
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
                className="rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-dark)]"
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
