import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import LoginModal from './LoginModal'
import RegisterModal from './RegisterModal'
import { buildDisplayName } from '../utils/profileValidation'
import NotificationBell from './NotificationBell'
import { useFavoritesContext } from '../context/FavoritesContext'

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
  { label: 'ภาพรวมทัวร์', path: '/admin/tour-overview', match: (pathname: string) => pathname === '/admin/tour-overview' },
  { label: 'จัดการการจอง', path: '/admin/bookings', match: (pathname: string) => pathname.startsWith('/admin/bookings') },
  { label: 'เทศกาล', path: '/admin/festivals', match: (pathname: string) => pathname === '/admin/festivals' },
]

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const { total: favCount } = useFavoritesContext()
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
                  <>
                    <Link
                      to="/favorites"
                      className={`ui-focus-ring ui-pressable relative inline-flex items-center justify-center rounded-2xl border p-1.5 transition-colors ${
                        pathname === '/favorites'
                          ? 'border-red-200 bg-red-50 text-red-500'
                          : 'border-transparent text-gray-400 hover:border-red-100 hover:bg-red-50 hover:text-red-500'
                      }`}
                      aria-label="ทัวร์ที่ถูกใจ"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill={pathname === '/favorites' || favCount > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </Link>
                    <Link
                      to="/my-bookings"
                      aria-label="การจองของฉัน"
                      className={`ui-focus-ring ui-pressable inline-flex items-center rounded-2xl border p-2 text-[13px] text-gray-500 transition-colors sm:text-[15px] ${
                        pathname === '/my-bookings'
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]/60 text-[var(--color-primary)]'
                          : 'border-transparent hover:border-[var(--color-primary-light)] hover:bg-[var(--color-primary-light)]/60 hover:text-[var(--color-primary)]'
                      }`}
                    >
                      <svg className="h-4.5 w-4.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V5m8 2V5m-9 9h10m-11 6h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2Z" />
                      </svg>
                    </Link>
                  </>
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

      <div
        className={`fixed inset-0 z-[var(--z-drawer)] md:hidden transition-opacity duration-300 ${mobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
      >
        <button
          type="button"
          aria-label="ปิดเมนูนำทาง"
          className="absolute inset-0 bg-black/30"
          onClick={() => setMobileMenuOpen(false)}
        />
        <aside
          className={`absolute right-0 top-0 flex h-full w-[min(20rem,85vw)] flex-col border-l border-gray-200 bg-white shadow-[-8px_0_30px_rgba(15,23,42,0.12)] transition-transform duration-300 ease-[cubic-bezier(.32,.72,0,1)] ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex h-[68px] items-center justify-between border-b border-gray-100 px-5">
            <span className="text-base font-bold text-gray-900">เมนู</span>
            <button
              type="button"
              aria-label="ปิดเมนูนำทาง"
              onClick={() => setMobileMenuOpen(false)}
              className="ui-pressable flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-5">
            <div className="space-y-1.5">
              {mobileLinks.map(({ label, path, match }) => (
                <Link
                  key={path}
                  to={path}
                  className={typeof match === 'function'
                    ? `block rounded-2xl px-4 py-3 text-[15px] font-semibold transition-colors ${match(pathname)
                      ? 'bg-amber-50 text-amber-800'
                      : 'text-gray-700 hover:bg-gray-50'
                    }`
                    : `block rounded-2xl px-4 py-3 text-[15px] font-semibold transition-colors ${isActive(path)
                      ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                      : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {label}
                </Link>
              ))}
            </div>

            {user && user.role === 'customer' && user.profileCompleted && (
              <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3">
                <Link
                  to="/favorites"
                  className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-[15px] font-semibold transition-colors ${pathname === '/favorites' ? 'bg-red-50 text-red-500' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill={pathname === '/favorites' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  ทัวร์ที่ถูกใจ
                </Link>
                <Link
                  to="/my-bookings"
                  className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-[15px] font-semibold transition-colors ${pathname === '/my-bookings' ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V5m8 2V5m-9 9h10m-11 6h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2Z" />
                  </svg>
                  การจองของฉัน
                </Link>
              </div>
            )}

            {user && user.role === 'customer' && !user.profileCompleted && (
              <div className="mt-3 border-t border-gray-100 pt-3">
                <Link
                  to="/auth/complete-profile"
                  className="block rounded-2xl bg-amber-50 px-4 py-3 text-[15px] font-semibold text-amber-700 transition-colors hover:bg-amber-100"
                >
                  กรอกข้อมูลให้ครบ
                </Link>
              </div>
            )}
          </nav>

          <div className="border-t border-gray-100 px-4 py-4">
            {user ? (
              <div className="space-y-3">
                <div className="px-1">
                  <p className="truncate text-sm font-semibold text-gray-800">{displayName}</p>
                  <p className="truncate text-xs text-gray-500">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="ui-pressable w-full rounded-2xl border border-red-200 bg-white px-4 py-3 text-center text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                >
                  ออกจากระบบ
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="px-1 text-sm text-gray-500">เข้าสู่ระบบเพื่อดูการจองและรับคำแนะนำทริป</p>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setModalError('')
                    setModal('login')
                  }}
                  className="ui-focus-ring ui-pressable w-full rounded-2xl bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--color-primary-dark)]"
                >
                  เข้าสู่ระบบ
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>

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
