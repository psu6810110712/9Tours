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

  useEffect(() => {
    if (location.state && (location.state as any).requireLogin) {
      setModal('login')
      navigate(pathname, { replace: true, state: {} })
    }
  }, [location, navigate, pathname])

  const isActive = (path: string) => {
    const [p, q] = path.split('?')
    if (q) return pathname === p && search.includes(q)
    return pathname === p && !search
  }

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  const navLinkClass = (path: string) =>
    isActive(path)
      ? 'text-[var(--color-primary)] font-semibold border-b-2 border-[var(--color-primary)] pb-0.5'
      : 'text-gray-500 hover:text-gray-900 transition-colors border-b-2 border-transparent pb-0.5'

  return (
    <>
      {/* border-b แทน shadow ดูสะอาดและ professional กว่า */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-8 h-[68px] flex items-center justify-between gap-8">

          {/* โลโก้ */}
          <Link to="/" className="flex-shrink-0">
            <img src="/logo.png" alt="9Tours" className="h-16 w-auto" />
          </Link>

          {/* เมนูกลาง — breathing room มากขึ้น */}
          <div className="hidden md:flex items-center gap-8 text-[15px]">
            {NAV_LINKS.map(({ label, path }) => (
              <Link key={path} to={path} className={navLinkClass(path)}>
                {label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin/tours"
                className={
                  pathname.startsWith('/admin')
                    ? 'text-[var(--color-primary)] font-semibold border-b-2 border-[var(--color-primary)] pb-0.5'
                    : 'text-gray-500 hover:text-gray-900 transition-colors border-b-2 border-transparent pb-0.5'
                }
              >
                จัดการทัวร์
              </Link>
            )}
          </div>

          {/* ด้านขวา */}
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

                {/* Avatar dropdown */}
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
                        {isAdmin && (
                          <Link
                            to="/admin/tours"
                            className="block px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setMenuOpen(false)}
                          >
                            จัดการทัวร์ (Admin)
                          </Link>
                        )}
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
              /* ปุ่มใหญ่ขึ้น rounded-xl และ font-semibold ดูหนักแน่นขึ้น */
              <button
                onClick={() => setModal('login')}
                className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                เข้าสู่ระบบ
              </button>
            )}
          </div>
        </div>
      </nav>

      {modal === 'login' && (
        <LoginModal onClose={() => setModal(null)} onSwitchToRegister={() => setModal('register')} />
      )}
      {modal === 'register' && (
        <RegisterModal onClose={() => setModal(null)} onSwitchToLogin={() => setModal('login')} />
      )}
    </>
  )
}
