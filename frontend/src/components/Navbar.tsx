import { useState } from 'react'
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
  const { pathname, search } = useLocation()

  // ตรวจว่า link นี้ active หรือไม่ — เช็ค path + query string
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

  return (
    <>
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

          {/* โลโก้ */}
          <Link to="/">
            <img src="/logo.png" alt="9Tours" className="h-10 w-auto" />
          </Link>

          {/* เมนูกลาง */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            {NAV_LINKS.map(({ label, path }) => (
              <Link
                key={path}
                to={path}
                className={
                  isActive(path)
                    ? 'text-[var(--color-primary)] font-semibold'
                    : 'text-gray-600 hover:text-[var(--color-primary)] transition-colors'
                }
              >
                {label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin/tours"
                className={
                  pathname.startsWith('/admin')
                    ? 'text-[var(--color-primary)] font-semibold'
                    : 'text-gray-600 hover:text-[var(--color-primary)] transition-colors'
                }
              >
                จัดการทัวร์
              </Link>
            )}
          </div>

          {/* ด้านขวา */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* การจองของฉัน — แสดงเฉพาะหลัง login */}
                <Link
                  to="/my-bookings"
                  className={`hidden md:block text-sm font-medium transition-colors ${
                    pathname === '/my-bookings'
                      ? 'text-[var(--color-primary)]'
                      : 'text-gray-600 hover:text-[var(--color-primary)]'
                  }`}
                >
                  การจองของฉัน
                </Link>

                {/* Avatar dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700"
                  >
                    <span className="w-8 h-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="hidden md:block">{user.name}</span>
                  </button>

                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 text-sm z-20">
                        {isAdmin && (
                          <Link
                            to="/admin/tours"
                            className="block px-4 py-2.5 text-gray-700 hover:bg-gray-50"
                            onClick={() => setMenuOpen(false)}
                          >
                            จัดการทัวร์ (Admin)
                          </Link>
                        )}
                        <hr className="my-1 border-gray-100" />
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2.5 text-red-500 hover:bg-gray-50"
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
                onClick={() => setModal('login')}
                className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
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
