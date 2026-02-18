import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoginModal from './LoginModal'
import RegisterModal from './RegisterModal'

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [modal, setModal] = useState<'login' | 'register' | null>(null)
  const navigate = useNavigate()

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
          <Link to="/" className="flex items-center gap-0.5 text-xl font-bold">
            <span className="text-[#F5A623]">9</span>
            <span className="text-gray-800">Tours</span>
          </Link>

          {/* เมนูกลาง */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link to="/" className="hover:text-[#F5A623] transition-colors">หน้าแรก</Link>
            <Link to="/tours?tourType=one_day" className="hover:text-[#F5A623] transition-colors">วันเดย์ทริป</Link>
            <Link to="/tours?tourType=package" className="hover:text-[#F5A623] transition-colors">เที่ยวพร้อมที่พัก</Link>
            <Link to="/tours" className="hover:text-[#F5A623] transition-colors">การจองออนไลน์</Link>
            {isAdmin && (
              <Link to="/admin/tours" className="text-orange-500 hover:text-orange-600 transition-colors">
                จัดการทัวร์
              </Link>
            )}
          </div>

          {/* ด้านขวา */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700"
                >
                  <span className="w-8 h-8 rounded-full bg-[#F5A623] text-white flex items-center justify-center font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden md:block">{user.name}</span>
                </button>

                {menuOpen && (
                  <>
                    {/* backdrop สำหรับปิด dropdown */}
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 text-sm z-20">
                      <Link to="/my-bookings" className="block px-4 py-2.5 text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                        การจองของฉัน
                      </Link>
                      {isAdmin && (
                        <Link to="/admin/tours" className="block px-4 py-2.5 text-gray-700 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                          จัดการทัวร์ (Admin)
                        </Link>
                      )}
                      <hr className="my-1 border-gray-100" />
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-red-500 hover:bg-gray-50">
                        ออกจากระบบ
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => setModal('login')}
                className="bg-[#F5A623] hover:bg-[#E09415] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                เข้าสู่ระบบ
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Modals */}
      {modal === 'login' && (
        <LoginModal
          onClose={() => setModal(null)}
          onSwitchToRegister={() => setModal('register')}
        />
      )}
      {modal === 'register' && (
        <RegisterModal
          onClose={() => setModal(null)}
          onSwitchToLogin={() => setModal('login')}
        />
      )}
    </>
  )
}
