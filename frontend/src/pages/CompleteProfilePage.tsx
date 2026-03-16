import { useMemo, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  normalizeEmail,
  normalizeThaiPhoneInput,
  PREFIX_OPTIONS,
  sanitizeCustomerName,
  validateCustomerProfile,
  type CustomerPrefix,
} from '../utils/profileValidation'
import { extractApiErrorMessage, extractApiFieldErrors } from '../utils/apiErrors'

interface CompleteProfileErrors {
  prefix?: string
  name?: string
  email?: string
  phone?: string
  form?: string
}

function inputClass(error?: string) {
  return `w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-colors ${
    error
      ? 'border-red-300 bg-red-50 focus:border-red-400'
      : 'border-gray-200 bg-white focus:border-blue-400'
  }`
}

export default function CompleteProfilePage() {
  const { user, updateOwnProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? '/'

  const initialPrefix = useMemo<CustomerPrefix>(() => {
    if (user?.prefix && PREFIX_OPTIONS.includes(user.prefix)) {
      return user.prefix
    }
    return 'นาย'
  }, [user?.prefix])

  const [prefix, setPrefix] = useState<CustomerPrefix>(initialPrefix)
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [errors, setErrors] = useState<CompleteProfileErrors>({})
  const [loading, setLoading] = useState(false)

  if (!user) {
    return null
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors = validateCustomerProfile({ prefix, name, email, phone })
    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors)
      return
    }

    setLoading(true)
    setErrors({})

    try {
      await updateOwnProfile(
        prefix,
        sanitizeCustomerName(name),
        normalizeEmail(email),
        normalizeThaiPhoneInput(phone) ?? phone,
      )
      navigate(returnTo || '/', { replace: true })
    } catch (error) {
      const fieldErrors = extractApiFieldErrors(error, ['prefix', 'name', 'email', 'phone'])
      setErrors({
        ...fieldErrors,
        form: extractApiErrorMessage(error, 'ไม่สามารถบันทึกข้อมูลได้ กรุณาตรวจสอบข้อมูลแล้วลองใหม่อีกครั้ง'),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#F8FAFC] py-12">
      <div className="mx-auto max-w-2xl px-6">
        <div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="bg-gradient-to-r from-sky-50 via-white to-amber-50 px-8 py-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">Complete Profile</p>
            <h1 className="mt-3 text-3xl font-bold text-gray-900">กรอกข้อมูลให้ครบก่อนทำรายการต่อ</h1>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              สำหรับบัญชีที่เข้าสู่ระบบผ่าน Google ระบบต้องมีคำนำหน้า ชื่อ-นามสกุล อีเมล และเบอร์โทรที่ตรวจสอบรูปแบบแล้ว
              เพื่อใช้ในขั้นตอนยืนยันข้อมูลการจอง
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 px-8 py-8">
            <div className="grid gap-5 md:grid-cols-[10rem_minmax(0,1fr)]">
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-800">คำนำหน้า</label>
                <select
                  value={prefix}
                  onChange={(event) => {
                    setPrefix(event.target.value as CustomerPrefix)
                    setErrors((prev) => ({ ...prev, prefix: undefined, form: undefined }))
                  }}
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
                <label className="mb-2 block text-sm font-bold text-gray-800">ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value)
                    setErrors((prev) => ({ ...prev, name: undefined, form: undefined }))
                  }}
                  className={inputClass(errors.name)}
                  placeholder="farn patcharapon"
                />
                <p className="mt-1 text-xs text-gray-400">กรอกเฉพาะชื่อและนามสกุล โดยไม่ต้องใส่คำนำหน้า</p>
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-800">อีเมล</label>
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setErrors((prev) => ({ ...prev, email: undefined, form: undefined }))
                }}
                className={inputClass(errors.email)}
                placeholder="name@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-gray-800">หมายเลขโทรศัพท์</label>
              <input
                type="tel"
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value)
                  setErrors((prev) => ({ ...prev, phone: undefined, form: undefined }))
                }}
                className={inputClass(errors.phone)}
                placeholder="0812345678 หรือ +66812345678"
              />
              <p className="mt-1 text-xs text-gray-400">รับเฉพาะเบอร์มือถือไทย และจะบันทึกเป็นรูปแบบ 0XXXXXXXXX</p>
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
            </div>

            {errors.form && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-500">{errors.form}</p>}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">หลังบันทึกแล้ว ระบบจะพาคุณกลับไปยังหน้าที่ตั้งใจจะใช้งานต่อ</p>
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
