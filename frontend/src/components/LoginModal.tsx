import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Modal from './common/Modal'

interface LoginModalProps {
  onClose: () => void
  onSwitchToRegister: () => void
  initialError?: string
}

export default function LoginModal({ onClose, onSwitchToRegister, initialError = '' }: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState(initialError)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)

      onClose()
    } catch {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} width="max-w-sm">
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
          className="w-full bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-semibold py-3 rounded-full transition-colors"
        >
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>

      <p className="text-sm text-center text-gray-500 mt-4">
        หากยังไม่มีบัญชี{' '}
        <button onClick={onSwitchToRegister} className="text-accent font-medium hover:underline">
          สมัครเลย
        </button>
      </p>
    </Modal >
  )
}
