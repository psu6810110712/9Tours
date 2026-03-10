import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import Modal from './common/Modal'
import { normalizeLoginIdentifier, validateLoginIdentifier } from '../utils/profileValidation'
import { extractApiErrorMessage, extractApiFieldErrors } from '../utils/apiErrors'

interface LoginModalProps {
  onClose: () => void
  onSwitchToRegister: () => void
  initialError?: string
}

function inputClass(error?: string) {
  return `w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
    error
      ? 'border-red-300 bg-red-50 focus:border-red-400'
      : 'border-gray-200 bg-gray-50 focus:border-blue-400'
  }`
}

export default function LoginModal({ onClose, onSwitchToRegister, initialError = '' }: LoginModalProps) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState<{ identifier?: string; password?: string; form?: string }>(
    initialError ? { form: initialError } : {},
  )
  const [loading, setLoading] = useState(false)
  const { login, loginWithGoogle } = useAuth()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const identifierError = validateLoginIdentifier(identifier)
    const passwordError = password.trim() ? undefined : 'กรุณาระบุรหัสผ่าน'
    if (identifierError || passwordError) {
      setErrors({ identifier: identifierError, password: passwordError })
      return
    }

    setLoading(true)
    setErrors({})

    try {
      await login(normalizeLoginIdentifier(identifier), password, remember)
      onClose()
    } catch (error) {
      const fieldErrors = extractApiFieldErrors(error, ['identifier', 'password'])
      setErrors({
        ...fieldErrors,
        form: extractApiErrorMessage(error, 'อีเมลหรือหมายเลขโทรศัพท์หรือรหัสผ่านไม่ถูกต้อง'),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    setErrors({})
    loginWithGoogle()
  }

  return (
    <Modal isOpen={true} onClose={onClose} width="max-w-sm">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-800"
      >
        ✕
      </button>

      <div className="mb-6 flex flex-col items-center">
        <img src="/logo.png" alt="9Tours" className="mb-3 h-20 w-auto" />
        <h2 className="text-2xl font-bold text-gray-800">ยินดีต้อนรับ!</h2>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="w-full rounded-full border border-gray-300 bg-white py-3 font-semibold text-gray-800 transition-colors hover:bg-gray-50"
      >
        เข้าสู่ระบบด้วย Google
      </button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-400">หรือ</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-base font-bold text-gray-800">อีเมลหรือหมายเลขโทรศัพท์</label>
          <input
            type="text"
            value={identifier}
            onChange={(event) => {
              setIdentifier(event.target.value)
              setErrors((prev) => ({ ...prev, identifier: undefined, form: undefined }))
            }}
            placeholder="name@example.com หรือ 0812345678"
            required
            className={inputClass(errors.identifier)}
          />
          {errors.identifier && <p className="mt-1 text-xs text-red-500">{errors.identifier}</p>}
        </div>

        <div>
          <label className="mb-1 block text-base font-bold text-gray-800">รหัสผ่าน</label>
          <input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              setErrors((prev) => ({ ...prev, password: undefined, form: undefined }))
            }}
            placeholder="โปรดระบุรหัสผ่านของท่าน"
            required
            className={inputClass(errors.password)}
          />
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
        </div>

        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="accent-blue-500"
          />
          <span className="text-sm text-gray-600">จดจำฉัน</span>
        </label>

        {errors.form && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500">{errors.form}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-primary py-3 font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        หากยังไม่มีบัญชี{' '}
        <button onClick={onSwitchToRegister} className="font-medium text-accent hover:underline">
          สมัครเลย
        </button>
      </p>
    </Modal>
  )
}
