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
}

interface RegisterFormErrors {
  prefix?: string
  name?: string
  email?: string
  phone?: string
  password?: string
  agree?: string
  form?: string
}

const INITIAL_FORM: RegisterFormState = {
  prefix: 'นาย',
  name: '',
  email: '',
  phone: '',
  password: '',
}

function inputClass(error?: string) {
  return `w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
    error
      ? 'border-red-300 bg-red-50 focus:border-red-400'
      : 'border-gray-200 bg-gray-50 focus:border-blue-400'
  }`
}

export default function RegisterModal({ onClose, onSwitchToLogin }: RegisterModalProps) {
  const [form, setForm] = useState<RegisterFormState>(INITIAL_FORM)
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
        onClick={onClose}
        className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-800"
      >
        ✕
      </button>

      <div className="mb-4 flex flex-col items-center">
        <img src="/logo.png" alt="9Tours" className="mb-3 h-20 w-auto" />
        <h2 className="text-2xl font-bold text-gray-800">สมัครสมาชิก</h2>
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="w-full rounded-full border border-gray-300 bg-white py-3 font-semibold text-gray-800 transition-colors hover:bg-gray-50"
      >
        สมัครด้วย Google
      </button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-400">หรือ</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
          <div>
            <label className="mb-1 block text-base font-bold text-gray-800">คำนำหน้า</label>
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
            {errors.prefix && <p className="mt-1 text-xs text-red-500">{errors.prefix}</p>}
          </div>

          <div>
            <label className="mb-1 block text-base font-bold text-gray-800">ชื่อ-นามสกุล</label>
            <input
              type="text"
              value={form.name}
              onChange={(event) => setField('name', event.target.value)}
              placeholder="farn patcharapon"
              required
              className={inputClass(errors.name)}
            />
            <p className="mt-1 text-xs text-gray-400">ตามที่ปรากฏบนบัตรประชาชน โดยไม่ต้องมีคำนำหน้าหรืออักษรพิเศษ</p>
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-base font-bold text-gray-800">อีเมล</label>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setField('email', event.target.value)}
            placeholder="name@example.com"
            required
            className={inputClass(errors.email)}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </div>

        <div>
          <label className="mb-1 block text-base font-bold text-gray-800">หมายเลขโทรศัพท์</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(event) => setField('phone', event.target.value)}
            placeholder="0812345678 หรือ +66812345678"
            required
            className={inputClass(errors.phone)}
          />
          <p className="mt-1 text-xs text-gray-400">ระบบจะบันทึกเป็นรูปแบบ 0XXXXXXXXX และใช้สำหรับล็อกอินได้</p>
          {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
        </div>

        <div>
          <label className="mb-1 block text-base font-bold text-gray-800">รหัสผ่าน</label>
          <input
            type="password"
            value={form.password}
            onChange={(event) => setField('password', event.target.value)}
            placeholder="อย่างน้อย 8 ตัวอักษร"
            required
            minLength={8}
            className={inputClass(errors.password)}
          />
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
        </div>

        <label className="flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            checked={agree}
            onChange={(event) => {
              setAgree(event.target.checked)
              setErrors((prev) => ({ ...prev, agree: undefined, form: undefined }))
            }}
            className="mt-0.5 accent-blue-500"
          />
          <span className="text-sm text-gray-600">
            ฉันยอมรับ <span className="cursor-pointer text-accent hover:underline">ข้อกำหนดและเงื่อนไข</span> และ{' '}
            <span className="cursor-pointer text-accent hover:underline">นโยบายความเป็นส่วนตัว</span>
          </span>
        </label>
        {errors.agree && <p className="text-xs text-red-500">{errors.agree}</p>}

        {errors.form && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-500">{errors.form}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-primary py-3 font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {loading ? 'กำลังสมัคร...' : 'ยืนยัน'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        หากมีบัญชีแล้ว{' '}
        <button onClick={onSwitchToLogin} className="font-medium text-accent hover:underline">
          เข้าสู่ระบบที่นี่
        </button>
      </p>
    </Modal>
  )
}
