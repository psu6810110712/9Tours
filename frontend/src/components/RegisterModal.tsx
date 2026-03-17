import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import Modal from './common/Modal'
import {
  normalizeEmail,
  normalizeThaiPhoneInput,
  PREFIX_OPTIONS,
  sanitizeCustomerName,
  validateCustomerProfile,
  type CustomerPrefix,
} from '../utils/profileValidation'
import { extractApiErrorMessage, extractApiFieldErrors } from '../utils/apiErrors'

interface RegisterModalProps {
  onClose: () => void
  onSwitchToLogin: () => void
}

interface RegisterFormState {
  prefix: CustomerPrefix
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}

interface RegisterFormErrors {
  prefix?: string
  name?: string
  email?: string
  phone?: string
  password?: string
  confirmPassword?: string
  agree?: string
  form?: string
}

const INITIAL_FORM: RegisterFormState = {
  prefix: 'นาย',
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
}

function inputClass(error?: string) {
  return `ui-focus-ring w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-all ${
    error
      ? 'border-red-200 bg-red-50/80 text-red-900 placeholder:text-red-300 focus:border-red-300'
      : 'border-gray-200 bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-[var(--color-primary)] focus:bg-white'
  }`
}

export default function RegisterModal({ onClose, onSwitchToLogin }: RegisterModalProps) {
  const [form, setForm] = useState<RegisterFormState>(INITIAL_FORM)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agree, setAgree] = useState(false)
  const [errors, setErrors] = useState<RegisterFormErrors>({})
  const [loading, setLoading] = useState(false)
  const { register, loginWithGoogle } = useAuth()

  const setField = <TField extends keyof RegisterFormState>(field: TField, value: RegisterFormState[TField]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined, form: undefined }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const profileErrors = validateCustomerProfile({
      prefix: form.prefix,
      name: form.name,
      email: form.email,
      phone: form.phone,
    })

    const nextErrors: RegisterFormErrors = {
      ...profileErrors,
      password: form.password.trim().length >= 8 ? undefined : 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร',
      confirmPassword: form.password !== form.confirmPassword ? 'รหัสผ่านไม่ตรงกัน' : undefined,
      agree: agree ? undefined : 'กรุณายอมรับข้อกำหนดและนโยบายก่อนสมัครสมาชิก',
    }

    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors)
      return
    }

    setLoading(true)
    setErrors({})

    try {
      await register(
        form.prefix,
        sanitizeCustomerName(form.name),
        normalizeEmail(form.email),
        normalizeThaiPhoneInput(form.phone) ?? form.phone,
        form.password,
      )
      onClose()
    } catch (error) {
      const fieldErrors = extractApiFieldErrors(error, ['prefix', 'name', 'email', 'phone', 'password'])
      setErrors({
        ...fieldErrors,
        form: extractApiErrorMessage(error, 'ไม่สามารถสมัครสมาชิกได้ กรุณาตรวจสอบข้อมูลแล้วลองใหม่อีกครั้ง'),
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
    <Modal isOpen={true} onClose={onClose} width="max-w-md">
      <button
        type="button"
        onClick={onClose}
        className="ui-focus-ring absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
      >
        ✕
      </button>

      <div className="mb-5 flex flex-col items-center text-center">
        <img src="/logo.png" alt="9Tours" className="mb-3 h-20 w-auto" />
        <h2 className="text-2xl font-bold text-gray-900">สมัครสมาชิก</h2>
        <p className="mt-2 text-sm text-gray-500">สร้างบัญชีเพื่อจองทริปและติดตามสถานะได้สะดวกขึ้น</p>
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
        สมัครด้วย Google
      </button>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-gray-400">หรือ</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-800">คำนำหน้า</label>
            <select
              value={form.prefix}
              onChange={(event) => setField('prefix', event.target.value as CustomerPrefix)}
              className={inputClass(errors.prefix)}
            >
              {PREFIX_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.prefix && <p className="mt-1.5 text-xs text-red-500">{errors.prefix}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-800">ชื่อ-นามสกุล</label>
            <input
              type="text"
              value={form.name}
              onChange={(event) => setField('name', event.target.value)}
              placeholder="farn patcharapon"
              required
              className={inputClass(errors.name)}
            />
            <p className="mt-1.5 text-xs text-gray-400">ตามที่ปรากฏบนบัตรประชาชน โดยไม่ต้องมีคำนำหน้าหรืออักษรพิเศษ</p>
            {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-800">อีเมล</label>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setField('email', event.target.value)}
            placeholder="name@example.com"
            required
            className={inputClass(errors.email)}
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-800">หมายเลขโทรศัพท์</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(event) => setField('phone', event.target.value)}
            placeholder="0812345678 หรือ +66812345678"
            required
            className={inputClass(errors.phone)}
          />
          <p className="mt-1.5 text-xs text-gray-400">ระบบจะบันทึกเป็นรูปแบบ 0XXXXXXXXX และใช้สำหรับล็อกอินได้</p>
          {errors.phone && <p className="mt-1.5 text-xs text-red-500">{errors.phone}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-800">รหัสผ่าน</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(event) => setField('password', event.target.value)}
              placeholder="อย่างน้อย 8 ตัวอักษร"
              required
              minLength={8}
              className={inputClass(errors.password)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
            >
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-4.753 4.753m4.753-4.753L3.596 3.596m16.807 16.807L3.596 3.596M9.172 9.172L21 21m-12-12l12 12" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-800">ยืนยันรหัสผ่าน</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={(event) => setField('confirmPassword', event.target.value)}
              placeholder="ระบุรหัสผ่านอีกครั้ง"
              required
              minLength={8}
              className={inputClass(errors.confirmPassword)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label={showConfirmPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
            >
              {showConfirmPassword ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-4.753 4.753m4.753-4.753L3.596 3.596m16.807 16.807L3.596 3.596M9.172 9.172L21 21m-12-12l12 12" />
                </svg>
              )}
            </button>
          </div>
          {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-500">{errors.confirmPassword}</p>}
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 px-4 py-3">
          <input
            type="checkbox"
            checked={agree}
            onChange={(event) => {
              setAgree(event.target.checked)
              setErrors((prev) => ({ ...prev, agree: undefined, form: undefined }))
            }}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-blue-500"
          />
          <span className="text-sm text-gray-600">
            ฉันยอมรับ <span className="cursor-pointer text-accent hover:underline">ข้อกำหนดและเงื่อนไข</span> และ{' '}
            <span className="cursor-pointer text-accent hover:underline">นโยบายความเป็นส่วนตัว</span>
          </span>
        </label>
        {errors.agree && <p className="text-xs text-red-500">{errors.agree}</p>}

        {errors.form && <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{errors.form}</p>}

        <button
          type="submit"
          disabled={loading}
          className="ui-focus-ring ui-pressable w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:transform-none"
        >
          {loading ? 'กำลังสมัคร...' : 'ยืนยัน'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        หากมีบัญชีแล้ว{' '}
        <button type="button" onClick={onSwitchToLogin} className="font-medium text-accent hover:underline">
          เข้าสู่ระบบที่นี่
        </button>
      </p>
    </Modal>
  )
}

