import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface NavbarProps {
  onLoginClick?: () => void
}

export default function Navbar({ onLoginClick }: NavbarProps) {
  const { user, logout, isAdmin } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* โลโก้ */}
        <Link to="/" className="flex items-center gap-1 text-xl font-bold">
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
            <Link to="/admin/tours" className="hover:text-[#F5A623] transition-colors text-orange-500">
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
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-[#F5A623]"
              >
                {/* avatar วงกลมตัวอักษร */}
                <span className="w-8 h-8 rounded-full bg-[#F5A623] text-white flex items-center justify-center font-bold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="hidden md:block">{user.name}</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 text-sm">
                  <Link
                    to="/my-bookings"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    การจองของฉัน
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin/tours"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      จัดการทัวร์
                    </Link>
                  )}
                  <hr className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-500 hover:bg-gray-50"
                  >
                    ออกจากระบบ
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="bg-[#F5A623] hover:bg-[#E09415] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              เข้าสู่ระบบ
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
