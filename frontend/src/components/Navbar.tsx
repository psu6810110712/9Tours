import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import LoginModal from './LoginModal'
import RegisterModal from './RegisterModal'
import { buildDisplayName } from '../utils/profileValidation'
import NotificationBell from './NotificationBell'

type NavLink = {
  label: string
  path: string
  match?: (pathname: string) => boolean
}

const NAV_LINKS: NavLink[] = [
  { label: 'หน้าแรก', path: '/' },
  { label: 'วันเดย์ทริป', path: '/tours?tourType=one_day' },
  { label: 'เที่ยวพร้อมที่พัก', path: '/tours?tourType=package' },
]

const ADMIN_LINKS: NavLink[] = [
  { label: 'แดชบอร์ด', path: '/admin/dashboard', match: (pathname: string) => pathname === '/admin/dashboard' },
  { label: 'จัดการทัวร์', path: '/admin/tours', match: (pathname: string) => pathname === '/admin/tours' || pathname === '/admin/tours/new' || pathname.startsWith('/admin/tours/') },
  { label: 'รอบการจอง', path: '/admin/tour-overview', match: (pathname: string) => pathname === '/admin/tour-overview' },
  { label: 'จัดการการจอง', path: '/admin/bookings', match: (pathname: string) => pathname.startsWith('/admin/bookings') },
]

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [modal, setModal] = useState<'login' | 'register' | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { pathname, search } = location
  const [modalError, setModalError] = useState('')

  useBodyScrollLock(mobileMenuOpen)

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

  useEffect(() => {
    setMenuOpen(false)
    setMobileMenuOpen(false)
  }, [pathname, search])

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
    setMobileMenuOpen(false)
    navigate('/')
  }

  const navLinkClass = (path: string) =>
    isActive(path)
      ? 'rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm'
      : 'rounded-full px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900'

  const mobileNavLinkClass = (path: string) =>
    `rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${isActive(path)
      ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
      : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
    }`

  const navShellClass = isAdmin
    ? 'fixed inset-x-0 top-0 z-[var(--z-navbar)] border-b border-slate-800/80 bg-slate-800 text-white'
    : 'sticky top-0 z-[var(--z-navbar)] border-b border-gray-200/90 bg-white/95 backdrop-blur'

  const logoTarget = isAdmin ? '/admin/dashboard' : '/'
  const desktopLinks = isAdmin ? ADMIN_LINKS : NAV_LINKS
  const mobileLinks = isAdmin ? ADMIN_LINKS : NAV_LINKS

  return (
    <>
      <nav className={navShellClass}>
        <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link to={logoTarget} className="flex min-w-0 items-center">
            <img src="/logo.png" alt="9Tours" className="h-14 w-auto sm:h-16" />
          </Link>

          <div className="hidden items-center gap-2 text-[15px] md:flex">
            {desktopLinks.map(({ label, path, match }) => {
              const active = typeof match === 'function' ? match(pathname) : isActive(path)
              return (
                <Link
                  key={path}
                  to={path}
                  className={active
                    ? (isAdmin
                      ? 'rounded-full bg-white/14 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/15'
                      : navLinkClass(path))
                    : (isAdmin
                      ? 'rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/8 hover:text-white'
                      : navLinkClass(path))}
                >
                  {label}
                </Link>
              )
            })}
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
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

                {(user.role === 'customer' && user.profileCompleted) || isAdmin ? (
                  <NotificationBell />
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
                    type="button"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    aria-expanded={menuOpen}
                    className={`ui-focus-ring ui-pressable flex items-center gap-2 rounded-full border px-1.5 py-1 text-sm font-medium transition-colors ${
                      isAdmin
                        ? 'border-white/10 bg-white/6 text-white hover:border-white/20 hover:bg-white/10'
                        : 'border-transparent text-gray-700 hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold shadow-sm ${
                      isAdmin ? 'bg-white text-slate-900' : 'bg-[var(--color-primary)] text-white'
                    }`}>
                      {avatarLabel}
                    </span>
                    <span className="hidden max-w-[14rem] truncate md:block">{displayName}</span>
                    <svg className={`hidden h-4 w-4 transition-transform md:block ${isAdmin ? 'text-slate-300' : 'text-gray-400'} ${menuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                    </svg>
                  </button>

                  {menuOpen && (
                    <>
                      <button type="button" className="fixed inset-0 z-[47]" aria-label="ปิดเมนูผู้ใช้" onClick={() => setMenuOpen(false)} />
                      <div className="ui-surface ui-pop absolute right-0 z-[48] mt-3 w-60 overflow-hidden border border-gray-100 bg-white py-1.5 text-sm">
                        <div className="border-b border-gray-100 px-4 py-3">
                          <p className="truncate font-semibold text-gray-800">{displayName}</p>
                          <p className="truncate text-xs text-gray-500">{user.email}</p>
                        </div>
                        {user.role === 'customer' && !user.profileCompleted && (
                          <button
                            type="button"
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
                          type="button"
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
                type="button"
                onClick={() => {
                  setModalError('')
                  setModal('login')
                }}
                className="ui-focus-ring ui-pressable rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-dark)] sm:px-5"
              >
                เข้าสู่ระบบ
              </button>
            )}

            <button
              type="button"
              aria-label={mobileMenuOpen ? 'ปิดเมนูนำทาง' : 'เปิดเมนูนำทาง'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className={`ui-focus-ring ui-pressable flex h-11 w-11 items-center justify-center rounded-2xl border md:hidden ${
                isAdmin
                  ? 'border-white/10 bg-white/6 text-white hover:border-white/20 hover:bg-white/10'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {mobileMenuOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[var(--z-drawer)] md:hidden">
          <button
            type="button"
            aria-label="ปิดเมนูนำทาง"
            className="ui-overlay absolute inset-0 top-[68px]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="ui-surface ui-pop absolute inset-x-4 top-[80px] max-h-[calc(100vh-6rem)] overflow-y-auto rounded-[1.75rem] border border-gray-100 bg-white p-4 shadow-[0_18px_44px_rgba(15,23,42,0.14)]">
            <div className="space-y-2">
              {mobileLinks.map(({ label, path, match }) => (
                <Link
                  key={path}
                  to={path}
                  className={typeof match === 'function'
                    ? `rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${match(pathname)
                      ? 'border-amber-300 bg-amber-50 text-amber-800'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`
                    : mobileNavLinkClass(path)}
                >
                  {label}
                </Link>
              ))}
            </div>

            {user ? (
              <div className="mt-4 rounded-[1.5rem] border border-gray-100 bg-gray-50/80 p-4">
                <p className="text-sm font-semibold text-gray-800">{displayName}</p>
                <p className="mt-1 text-xs text-gray-500">{user.email}</p>

                <div className="mt-4 space-y-2">
                  {user.role === 'customer' && user.profileCompleted && (
                    <Link to="/my-bookings" className="block rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50">
                      การจองของฉัน
                    </Link>
                  )}
                  {user.role === 'customer' && !user.profileCompleted && (
                    <Link to="/auth/complete-profile" className="block rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100">
                      กรอกข้อมูลให้ครบ
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-2xl border border-red-200 bg-white px-4 py-3 text-left text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                  >
                    ออกจากระบบ
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-[1.5rem] border border-gray-100 bg-gray-50/80 p-4">
                <p className="text-sm text-gray-600">เข้าสู่ระบบเพื่อดูการจองและรับคำแนะนำทริปส่วนตัว</p>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setModalError('')
                    setModal('login')
                  }}
                  className="ui-focus-ring ui-pressable mt-3 w-full rounded-2xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--color-primary-dark)]"
                >
                  เข้าสู่ระบบ
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
