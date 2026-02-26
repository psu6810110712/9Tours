import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

interface LoginModalProps {
  onClose: () => void
  onSwitchToRegister: () => void
}

export default function LoginModal({ onClose, onSwitchToRegister }: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password, remember)

      onClose()
    } catch {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
    } finally {
      setLoading(false)
    }
  }

  return (
    // พื้นหลังสีดำโปร่งแสง — คลิกนอก modal เพื่อปิด
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-xl relative">

        {/* ปุ่มปิด — วางด้านบนขวาของ modal */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:border-gray-400 transition-colors"
        >
          ✕
        </button>

        {/* โลโก้และหัวข้อ */}
        <div className="flex flex-col items-center mb-6">
          <img src="/logo.png" alt="9Tours" className="h-20 w-auto mb-3" />
          <h2 className="text-2xl font-bold text-gray-800">ยินดีต้อนรับ!</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-base font-bold text-gray-800 mb-1 block">
              อีเมลหรือหมายเลขโทรศัพท์
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="โปรดระบุอีเมลหรือหมายเลขโทรศัพท์"
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors"
            />
          </div>

          <div>
            <label className="text-base font-bold text-gray-800 mb-1 block">รหัสผ่าน</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="โปรดระบุรหัสผ่านของท่าน"
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="accent-blue-500"
            />
            <span className="text-sm text-gray-600">จดจำฉัน</span>
          </label>

          {/* แสดงข้อความผิดพลาดเมื่อ login ไม่สำเร็จ */}
          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-semibold py-3 rounded-full transition-colors"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-4">
          หากยังไม่มีบัญชี{' '}
          <button onClick={onSwitchToRegister} className="text-[#F5A623] font-medium hover:underline">
            สมัครเลย
          </button>
        </p>
      </div>
    </div>
  )
}
