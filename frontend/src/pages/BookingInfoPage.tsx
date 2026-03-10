import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import BookingSummaryCard from '../components/booking/BookingSummaryCard'
import ProgressBar from '../components/common/ProgressBar'
import { useAuth } from '../context/AuthContext'
import { bookingService } from '../services/bookingService'
import { tourService } from '../services/tourService'
import type { Tour } from '../types/tour'
import { extractApiErrorMessage, extractApiFieldErrors } from '../utils/apiErrors'
import {
  normalizeEmail,
  normalizeThaiPhoneInput,
  PREFIX_OPTIONS,
  sanitizeCustomerName,
  validateCustomerProfile,
  type CustomerPrefix,
} from '../utils/profileValidation'

interface ContactDetails {
  prefix: CustomerPrefix
  name: string
  phone: string
  email: string
}

interface ContactFormErrors {
  prefix?: string
  name?: string
  phone?: string
  email?: string
  form?: string
}

function inputClass(error?: string) {
  return `w-full rounded-xl border px-4 py-3 text-base outline-none transition-all ${
    error
      ? 'border-red-300 bg-red-50 focus:border-red-400'
      : 'border-gray-300 bg-white focus:border-primary focus:ring-2 focus:ring-primary'
  }`
}

export default function BookingInfoPage() {
  const { tourId } = useParams<{ tourId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, refreshCurrentUser } = useAuth()

  const adults = Number.parseInt(searchParams.get('adults') || '1', 10)
  const children = Number.parseInt(searchParams.get('children') || '0', 10)
  const scheduleId = searchParams.get('scheduleId') || '-'

  const [tour, setTour] = useState<Tour | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<ContactFormErrors>({})
  const [contactMode, setContactMode] = useState<'yes' | 'no'>('yes')
  const accountContact = useMemo<ContactDetails>(() => ({
    prefix: user?.prefix ?? 'นาย',
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
  }), [user?.email, user?.name, user?.phone, user?.prefix])
  const [manualContactDraft, setManualContactDraft] = useState<ContactDetails>(accountContact)
  const [hasManualDraft, setHasManualDraft] = useState(false)
  const [specialRequest, setSpecialRequest] = useState('')

  useEffect(() => {
    if (!tourId) {
      return
    }

    tourService.getOne(Number(tourId))
      .then((data) => {
        setTour(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching tour:', error)
        window.alert('ไม่พบข้อมูลทัวร์นี้')
        navigate(-1)
      })
  }, [tourId, navigate])

  useEffect(() => {
    if (hasManualDraft) {
      return
    }

    setManualContactDraft(accountContact)
  }, [accountContact, hasManualDraft])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-lg font-bold text-gray-400">
        กำลังเตรียมข้อมูลการจอง...
      </div>
    )
  }

  const adultPrice = tour?.price || 6900
  const childPrice = tour?.childPrice ?? adultPrice
  const totalAdultPrice = adults * adultPrice
  const totalChildPrice = children * childPrice
  const totalPrice = totalAdultPrice + totalChildPrice
  const selectedSchedule = tour?.schedules?.find((schedule) => schedule.id === Number(scheduleId))
  const resolvedContact = contactMode === 'yes' ? accountContact : manualContactDraft
  const isAccountMode = contactMode === 'yes'

  const formatDate = (dateStr?: string) => {
    if (!dateStr) {
      return '-'
    }

    const timestamp = Date.parse(dateStr)
    if (Number.isNaN(timestamp)) {
      return dateStr
    }

    return new Date(dateStr).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const tourImage = tour?.images?.[0]
    ? typeof tour.images[0] === 'string'
      ? tour.images[0]
      : (tour.images[0] as { url?: string }).url ?? ''
    : 'https://images.unsplash.com/photo-1528181304800-2f140819898f?auto=format&fit=crop&w=300'

  const handleManualFieldChange = <TField extends keyof ContactDetails>(field: TField, value: ContactDetails[TField]) => {
    setManualContactDraft((prev) => ({ ...prev, [field]: value }))
    setHasManualDraft(true)
    setErrors((prev) => ({ ...prev, [field]: undefined, form: undefined }))
  }

  const handleModeChange = (mode: 'yes' | 'no') => {
    setContactMode(mode)
    setErrors({})
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (scheduleId === '-') {
      setErrors({ form: 'กรุณาระบุรอบเดินทางที่ต้องการ' })
      return
    }

    const validationErrors = validateCustomerProfile({
      prefix: resolvedContact.prefix,
      name: resolvedContact.name,
      email: resolvedContact.email,
      phone: resolvedContact.phone,
    })

    if (Object.values(validationErrors).some(Boolean)) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      const payload = {
        scheduleId: Number(scheduleId),
        paxCount: adults + children,
        adults,
        children,
        specialRequest: specialRequest.trim() || undefined,
        contactPrefix: resolvedContact.prefix,
        contactName: sanitizeCustomerName(resolvedContact.name),
        contactEmail: normalizeEmail(resolvedContact.email),
        contactPhone: normalizeThaiPhoneInput(resolvedContact.phone) ?? resolvedContact.phone,
      }

      const response = await bookingService.createBooking(payload)
      await refreshCurrentUser().catch(() => undefined)

      navigate(`/payment/${response.id}`, {
        state: {
          tourCode: tour?.tourCode || '-',
          tourName: tour?.name || 'Loading...',
          image: tourImage,
          adults,
          children,
          isPrivate: Boolean(tour?.minPeople),
        },
      })
    } catch (error) {
      const fieldErrors = extractApiFieldErrors(error, ['prefix', 'name', 'email', 'phone'], {
        prefix: ['contactprefix'],
        name: ['contactname'],
        email: ['contactemail', 'อีเมล'],
        phone: ['contactphone', 'โทรศัพท์', 'เบอร์'],
      })
      setErrors({
        ...fieldErrors,
        form: extractApiErrorMessage(error, 'ไม่สามารถทำการจองได้ กรุณาลองใหม่อีกครั้ง'),
      })
      console.error('Error creating booking:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-[#F8FAFC]">
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="relative mb-12 mt-4 flex justify-center">
          <button
            onClick={() => navigate(-1)}
            className="absolute left-0 top-0 z-20 mt-1 flex items-center gap-1.5 text-base font-bold text-primary transition-all hover:-translate-x-1 hover:underline"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            ย้อนกลับ
          </button>

          <ProgressBar currentStep={2} />
        </div>

        <h1 className="mb-8 mt-10 text-2xl font-bold text-gray-800">การจองของท่าน</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05),0_10px_20px_-2px_rgba(0,0,0,0.03)] lg:col-span-7 md:p-10">
            <h2 className="mb-8 text-xl font-bold text-gray-800">กรอกข้อมูลและตรวจสอบการจอง</h2>

            <div className="mb-10">
              <h3 className="mb-6 text-lg font-bold text-gray-800">รายละเอียดการติดต่อ</h3>

              <div className="relative mt-4 rounded-2xl border border-gray-200 p-6 md:p-8">
                <span className="absolute -top-[14px] left-6 bg-white px-3 text-[15px] font-bold text-gray-800">
                  ข้อมูลติดต่อ (สำหรับส่งใบจอง)
                </span>

                <div className="mt-2 grid grid-cols-1 gap-6 md:grid-cols-4">
                  <div className="md:col-span-1">
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      คำนำหน้า<span className="text-red-500">*</span>
                    </label>
                    <select
                      data-testid="contact-prefix"
                      className={`${inputClass(errors.prefix)} ${isAccountMode ? 'cursor-not-allowed bg-gray-100 text-gray-500' : ''}`}
                      value={resolvedContact.prefix}
                      onChange={(event) => handleManualFieldChange('prefix', event.target.value as CustomerPrefix)}
                      disabled={isAccountMode}
                    >
                      {PREFIX_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {errors.prefix && <p className="mt-2 text-sm text-red-500">{errors.prefix}</p>}
                  </div>

                  <div className="md:col-span-3">
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      ชื่อ-นามสกุล<span className="text-red-500">*</span>
                    </label>
                    <input
                      data-testid="contact-name"
                      required
                      className={`${inputClass(errors.name)} ${isAccountMode ? 'cursor-not-allowed bg-gray-100 text-gray-500' : ''}`}
                      value={resolvedContact.name}
                      onChange={(event) => handleManualFieldChange('name', event.target.value)}
                      placeholder="farn patcharapon"
                      readOnly={isAccountMode}
                    />
                    <p className="mt-2 text-sm text-gray-400">ตามที่ปรากฏอยู่บนบัตรประชาชน โดยไม่ต้องมีคำนำหน้าหรืออักษรพิเศษ</p>
                    {errors.name && <p className="mt-2 text-sm text-red-500">{errors.name}</p>}
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      หมายเลขโทรศัพท์<span className="text-red-500">*</span>
                    </label>
                    <input
                      data-testid="contact-phone"
                      required
                      type="tel"
                      className={`${inputClass(errors.phone)} ${isAccountMode ? 'cursor-not-allowed bg-gray-100 text-gray-500' : ''}`}
                      value={resolvedContact.phone}
                      onChange={(event) => handleManualFieldChange('phone', event.target.value)}
                      placeholder="0812345678 หรือ +66812345678"
                      readOnly={isAccountMode}
                    />
                    <p className="mt-2 text-sm text-gray-400">ระบบจะบันทึกเป็นรูปแบบ 0XXXXXXXXX</p>
                    {errors.phone && <p className="mt-2 text-sm text-red-500">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-gray-700">
                      อีเมล<span className="text-red-500">*</span>
                    </label>
                    <input
                      data-testid="contact-email"
                      required
                      type="email"
                      className={`${inputClass(errors.email)} ${isAccountMode ? 'cursor-not-allowed bg-gray-100 text-gray-500' : ''}`}
                      value={resolvedContact.email}
                      onChange={(event) => handleManualFieldChange('email', event.target.value)}
                      placeholder="name@example.com"
                      readOnly={isAccountMode}
                    />
                    <p className="mt-2 text-sm text-gray-400">ใช้สำหรับส่งรายละเอียดการจองและใบยืนยัน</p>
                    {errors.email && <p className="mt-2 text-sm text-red-500">{errors.email}</p>}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-4 px-2 sm:flex-row sm:gap-8">
                <label className="group flex cursor-pointer items-center gap-3">
                  <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${contactMode === 'yes' ? 'border-primary' : 'border-gray-400 group-hover:border-blue-400'}`}>
                    {contactMode === 'yes' && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                  </div>
                  <input
                    data-testid="use-account-info"
                    type="radio"
                    className="hidden"
                    name="useAccount"
                    value="yes"
                    checked={contactMode === 'yes'}
                    onChange={() => handleModeChange('yes')}
                  />
                  <span className={`text-base font-bold transition-colors ${contactMode === 'yes' ? 'text-primary' : 'text-gray-600 group-hover:text-gray-800'}`}>
                    ใช้ข้อมูลเดียวกับบัญชีของฉัน
                  </span>
                </label>

                <label className="group flex cursor-pointer items-center gap-3">
                  <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${contactMode === 'no' ? 'border-primary' : 'border-gray-400 group-hover:border-blue-400'}`}>
                    {contactMode === 'no' && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                  </div>
                  <input
                    data-testid="use-manual-info"
                    type="radio"
                    className="hidden"
                    name="useAccount"
                    value="no"
                    checked={contactMode === 'no'}
                    onChange={() => handleModeChange('no')}
                  />
                  <span className={`text-base font-bold transition-colors ${contactMode === 'no' ? 'text-primary' : 'text-gray-600 group-hover:text-gray-800'}`}>
                    กรอกข้อมูลเองทั้งหมด
                  </span>
                </label>
              </div>
              <p className="mt-4 px-2 text-sm text-gray-500">
                {isAccountMode
                  ? 'กำลังใช้ข้อมูลจากบัญชีของคุณ หากต้องการแก้ไขเฉพาะรายการนี้ให้เลือกกรอกข้อมูลเองทั้งหมด'
                  : 'คุณสามารถแก้ไขข้อมูลติดต่อสำหรับการจองนี้ได้ ระบบจะจำค่าที่คุณกรอกไว้ระหว่างการสลับโหมด'}
              </p>
            </div>

            <div className="relative mt-10 rounded-2xl border border-gray-200 p-6 md:p-8">
              <span className="absolute -top-[14px] left-6 bg-white px-3 text-[15px] font-bold text-gray-800">
                คำขอเพิ่มเติม (หากมี)
              </span>
              <textarea
                data-testid="special-request"
                rows={4}
                className="mt-2 w-full resize-none rounded-xl border border-gray-300 p-4 text-base outline-none transition-all placeholder:text-gray-300 focus:ring-2 focus:ring-primary"
                placeholder="คำขอพิเศษ"
                value={specialRequest}
                onChange={(event) => setSpecialRequest(event.target.value)}
              />
              <p className="mt-3 text-sm text-gray-400">สามารถระบุข้อมูลเพิ่มเติมที่ต้องการให้ทีมงานรับทราบได้</p>
            </div>

            {errors.form && <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-500">{errors.form}</p>}
          </div>

          <aside className="sticky top-10 lg:col-span-5">
            <BookingSummaryCard
              tourCode={tour?.tourCode || '-'}
              tourName={tour?.name || '-'}
              date={
                <>
                  {formatDate(selectedSchedule?.startDate)} -<br />
                  {formatDate(selectedSchedule?.endDate)}
                </>
              }
              adults={adults}
              children={children}
              adultPrice={adultPrice}
              childPrice={childPrice}
              image={tourImage}
              accommodation={tour?.accommodation || undefined}
              totalPrice={totalPrice}
              isPrivate={Boolean(tour?.minPeople)}
            />

            <div className="mt-6 flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full rounded-2xl py-4 text-lg font-bold text-white transition-all ${isSubmitting ? 'cursor-not-allowed bg-gray-400 shadow-none' : 'bg-primary shadow-[0_8px_20px_rgba(37,99,235,0.25)] hover:-translate-y-1 hover:bg-primary-dark active:translate-y-0'}`}
              >
                {isSubmitting ? 'กำลังดำเนินการ...' : 'ชำระเงิน'}
              </button>
            </div>
          </aside>
        </form>
      </main>
    </div>
  )
}
