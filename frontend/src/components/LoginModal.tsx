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
  return `ui-focus-ring w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all ${
    error
      ? 'border-red-200 bg-red-50/80 text-red-900 placeholder:text-red-300 focus:border-red-300'
      : 'border-gray-200 bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:bg-white'
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
        type="button"
        onClick={onClose}
        className="ui-focus-ring absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
      >
        ✕
      </button>

      <div className="mb-6 flex flex-col items-center text-center">
        <img src="/logo.png" alt="9Tours" className="mb-3 h-20 w-auto" />
        <h2 className="text-2xl font-bold text-gray-900">ยินดีต้อนรับกลับ</h2>
        <p className="mt-2 text-sm text-gray-500">เข้าสู่ระบบเพื่อจัดการการจองและติดตามทริปของคุณ</p>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="ui-focus-ring ui-pressable flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.9-4.2 2.9-7.2 0-.7-.1-1.4-.2-2H12z" />
          <path fill="#34A853" d="M12 21c2.6 0 4.9-.9 6.6-2.5l-3.1-2.4c-.9.6-2 .9-3.5.9-2.7 0-5-1.8-5.8-4.3l-3.2 2.5C4.7 18.7 8 21 12 21z" />
          <path fill="#4A90E2" d="M6.2 12.7c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2L3 6.2C2.4 7.5 2 9 2 10.7s.4 3.2 1 4.5l3.2-2.5z" />
          <path fill="#FBBC05" d="M12 4.4c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 1.5 14.6.4 12 .4 8 0 4.7 2.3 3 5.9l3.2 2.5C7 6.2 9.3 4.4 12 4.4z" />
        </svg>
        เข้าสู่ระบบด้วย Google
      </button>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-gray-400">หรือ</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-800">อีเมลหรือหมายเลขโทรศัพท์</label>
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
          {errors.identifier && <p className="mt-1.5 text-xs text-red-500">{errors.identifier}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-800">รหัสผ่าน</label>
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
          {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="h-4 w-4 rounded border-gray-300 accent-blue-500"
          />
          <span>จดจำฉัน</span>
        </label>

        {errors.form && <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{errors.form}</p>}

        <button
          type="submit"
          disabled={loading}
          className="ui-focus-ring ui-pressable w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:transform-none"
        >
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        หากยังไม่มีบัญชี{' '}
        <button type="button" onClick={onSwitchToRegister} className="font-medium text-accent hover:underline">
          สมัครเลย
        </button>
      </p>
    </Modal>
  )
}

