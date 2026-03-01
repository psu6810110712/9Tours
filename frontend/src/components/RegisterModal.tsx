import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Modal from './common/Modal'

interface RegisterModalProps {
  onClose: () => void
  onSwitchToLogin: () => void
}

export default function RegisterModal({ onClose, onSwitchToLogin }: RegisterModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // ตรวจสอบว่ากดยอมรับข้อตกลงก่อนส่งฟอร์ม
    if (!agree) {
      setError('กรุณายอมรับข้อตกลงก่อน')
      return
    }
    setError('')
    setLoading(true)
    try {
      await register(name, email, phone, password)
      onClose()
    } catch {
      setError('ไม่สามารถสมัครสมาชิกได้ อีเมลอาจถูกใช้งานแล้ว')
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
      <div className="flex flex-col items-center mb-4">
        <img src="/logo.png" alt="9Tours" className="h-20 w-auto mb-3" />
        <h2 className="text-2xl font-bold text-gray-800">สมัครสมาชิก</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-base font-bold text-gray-800 mb-1 block">ชื่อผู้ใช้</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="natee"
            required
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors"
          />
        </div>

        <div>
          <label className="text-base font-bold text-gray-800 mb-1 block">อีเมล</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="natee@example.com"
            required
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors"
          />
        </div>

        <div>
          <label className="text-base font-bold text-gray-800 mb-1 block">หมายเลขโทรศัพท์</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="095xxxxxxx"
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
            placeholder="ความยาว 8 ตัวอักษรขึ้นไป"
            required
            minLength={8}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition-colors"
          />
        </div>

        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="accent-blue-500 mt-0.5"
          />
          <span className="text-sm text-gray-600">
            ฉันยอมรับ{' '}
            <span className="text-accent cursor-pointer hover:underline">ข้อกำหนดและเงื่อนไข</span>
            {' '}และ{' '}
            <span className="text-accent cursor-pointer hover:underline">นโยบายความเป็นส่วนตัว</span>
          </span>
        </label>

        {/* แสดงข้อความผิดพลาดเมื่อสมัครไม่สำเร็จ */}
        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-semibold py-3 rounded-full transition-colors"
        >
          {loading ? 'กำลังสมัคร...' : 'ยืนยัน'}
        </button>
      </form>

      <p className="text-sm text-center text-gray-500 mt-4">
        หากมีบัญชีแล้ว{' '}
        <button onClick={onSwitchToLogin} className="text-accent font-medium hover:underline">
          เข้าสู่ระบบที่นี่
        </button>
      </p>
    </Modal >
  )
}
