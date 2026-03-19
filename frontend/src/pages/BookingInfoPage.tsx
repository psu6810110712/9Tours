import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import BookingSummaryCard from '../components/booking/BookingSummaryCard'
import ProgressBar from '../components/common/ProgressBar'
import { useAuth } from '../context/AuthContext'
import { bookingService } from '../services/bookingService'
import { tourService } from '../services/tourService'
import type { Tour } from '../types/tour'
import { extractApiErrorMessage, extractApiFieldErrors } from '../utils/apiErrors'
import { toast } from 'react-hot-toast'
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
  return `ui-focus-ring w-full rounded-2xl border px-4 py-3 text-base outline-none transition-all ${error
    ? 'border-red-200 bg-red-50/90 text-red-900 placeholder:text-red-300 focus:border-red-300'
    : 'border-gray-200 bg-gray-50 text-gray-800 placeholder:text-gray-300 focus:border-primary focus:bg-white'
    }`
}

export default function BookingInfoPage() {
  const { tourId } = useParams<{ tourId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, refreshCurrentUser } = useAuth()

  const [adults, setAdults] = useState(() => Number.parseInt(searchParams.get('adults') || '1', 10))
  const [children, setChildren] = useState(() => Number.parseInt(searchParams.get('children') || '0', 10))
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
  const [travelersInfo, setTravelersInfo] = useState<{ name: string; isLeadTraveler: boolean }[]>(
    () => Array.from({ length: adults + children }, (_, i) => ({ name: '', isLeadTraveler: i === 0 }))
  )

  useEffect(() => {
    setTravelersInfo((prev) => {
      const targetLength = adults + children
      if (prev.length === targetLength) return prev
      let newTravelers = [...prev]
      if (newTravelers.length > targetLength) {
        newTravelers = newTravelers.slice(0, targetLength)
      } else {
        const diff = targetLength - newTravelers.length
        newTravelers = [...newTravelers, ...Array.from({ length: diff }, () => ({ name: '', isLeadTraveler: false }))]
      }
      if (newTravelers.length > 0 && !newTravelers.some(t => t.isLeadTraveler)) {
        newTravelers[0].isLeadTraveler = true
      }
      return newTravelers
    })
  }, [adults, children])

  useEffect(() => {
    if (!tourId) {
      return
    }

    tourService.getOne(Number(tourId))
      .then((data) => {
        if (!data?.isActive) {
          toast.error('ทัวร์นี้ปิดให้บริการชั่วคราว ไม่สามารถจองได้')
          navigate('/tours', { replace: true })
          return
        }

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

  const isPrivate = Boolean(tour?.minPeople)
  const adultPrice = tour?.price || 6900
  const childPrice = tour?.childPrice ?? adultPrice
  const totalAdultPrice = isPrivate ? 0 : adults * adultPrice
  const totalChildPrice = isPrivate ? 0 : children * childPrice
  const totalPrice = isPrivate ? adultPrice : totalAdultPrice + totalChildPrice
  const selectedSchedule = tour?.schedules?.find((schedule) => schedule.id === Number(scheduleId))
  const resolvedContact = contactMode === 'yes' ? accountContact : manualContactDraft
  const isAccountMode = contactMode === 'yes'

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    const timestamp = Date.parse(dateStr)
    if (Number.isNaN(timestamp)) return dateStr
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
      const filledTravelers = travelersInfo
        .map((t) => ({ name: t.name.trim(), isLeadTraveler: t.isLeadTraveler }))
        .filter((t) => t.name.length > 0)

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
        travelersInfo: filledTravelers.length > 0 ? filledTravelers : undefined,
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
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="relative mb-8 mt-2 flex flex-col items-center gap-4 sm:mb-10 md:gap-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="ui-pressable absolute left-0 top-0 hidden items-center gap-1.5 text-base font-bold text-primary hover:underline md:flex"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19 3 12m0 0 7-7m-7 7h18" />
            </svg>
            ย้อนกลับ
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="ui-pressable self-start flex items-center gap-1.5 text-base font-bold text-primary hover:underline md:hidden"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19 3 12m0 0 7-7m-7 7h18" />
            </svg>
            ย้อนกลับ
          </button>
          <ProgressBar currentStep={2} />
        </div>

        <div className="mb-8 text-center lg:text-left">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">การจองของท่าน</h1>
          <p className="mt-2 text-sm text-gray-500">กรุณาตรวจสอบข้อมูลผู้ติดต่อและรายละเอียดการเดินทางก่อนดำเนินการต่อ</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <section className="ui-surface rounded-[1.75rem] border border-gray-100 bg-white p-6 md:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">รายละเอียดการติดต่อ</h2>
                <p className="mt-1 text-sm text-gray-500">ใช้สำหรับส่งใบยืนยันและติดต่อเรื่องการเดินทาง</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className={`rounded-[1.5rem] border px-4 py-4 transition-colors ${contactMode === 'yes' ? 'border-primary bg-[var(--color-primary-light)]' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 ${contactMode === 'yes' ? 'border-primary' : 'border-gray-400'}`}>
                      {contactMode === 'yes' && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                    </div>
                    <div>
                      <input
                        data-testid="use-account-info"
                        type="radio"
                        className="hidden"
                        name="useAccount"
                        value="yes"
                        checked={contactMode === 'yes'}
                        onChange={() => handleModeChange('yes')}
                      />
                      <p className={`text-base font-bold ${contactMode === 'yes' ? 'text-primary' : 'text-gray-700'}`}>ใช้ข้อมูลเดียวกับบัญชีของฉัน</p>
                      <p className="mt-1 text-sm text-gray-500">ดึงชื่อ อีเมล และเบอร์จากบัญชีที่ล็อกอินอยู่</p>
                    </div>
                  </div>
                </label>

                <label className={`rounded-[1.5rem] border px-4 py-4 transition-colors ${contactMode === 'no' ? 'border-primary bg-[var(--color-primary-light)]' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 ${contactMode === 'no' ? 'border-primary' : 'border-gray-400'}`}>
                      {contactMode === 'no' && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                    </div>
                    <div>
                      <input
                        data-testid="use-manual-info"
                        type="radio"
                        className="hidden"
                        name="useAccount"
                        value="no"
                        checked={contactMode === 'no'}
                        onChange={() => handleModeChange('no')}
                      />
                      <p className={`text-base font-bold ${contactMode === 'no' ? 'text-primary' : 'text-gray-700'}`}>กรอกข้อมูลเองทั้งหมด</p>
                      <p className="mt-1 text-sm text-gray-500">เหมาะกับกรณีจองให้ผู้เดินทางคนอื่น</p>
                    </div>
                  </div>
                </label>
              </div>

              <p className="mt-4 text-sm text-gray-500">
                {isAccountMode
                  ? 'กำลังใช้ข้อมูลจากบัญชีของคุณ หากต้องการแก้ไขเฉพาะรายการนี้ให้สลับเป็นกรอกข้อมูลเองทั้งหมด'
                  : 'คุณสามารถแก้ไขข้อมูลเฉพาะสำหรับรายการจองนี้ได้ โดยระบบจะจำค่าที่กรอกไว้ระหว่างการสลับโหมด'}
              </p>

              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">คำนำหน้า<span className="text-red-500">*</span></label>
                  <select
                    data-testid="contact-prefix"
                    className={`${inputClass(errors.prefix)} ${isAccountMode ? 'cursor-not-allowed bg-gray-100 text-gray-500' : ''}`}
                    value={resolvedContact.prefix}
                    onChange={(event) => handleManualFieldChange('prefix', event.target.value as CustomerPrefix)}
                    disabled={isAccountMode}
                  >
                    {PREFIX_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {errors.prefix && <p className="mt-1.5 text-sm text-red-500">{errors.prefix}</p>}
                </div>

                <div className="md:col-span-3">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">ชื่อ-นามสกุล<span className="text-red-500">*</span></label>
                  <input
                    data-testid="contact-name"
                    required
                    className={`${inputClass(errors.name)} ${isAccountMode ? 'cursor-not-allowed bg-gray-100 text-gray-500' : ''}`}
                    value={resolvedContact.name}
                    onChange={(event) => handleManualFieldChange('name', event.target.value)}
                    placeholder="farn patcharapon"
                    readOnly={isAccountMode}
                  />
                  <p className="mt-1.5 text-sm text-gray-400">ตามที่ปรากฏบนบัตรประชาชน โดยไม่ต้องมีคำนำหน้าหรืออักษรพิเศษ</p>
                  {errors.name && <p className="mt-1.5 text-sm text-red-500">{errors.name}</p>}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">หมายเลขโทรศัพท์<span className="text-red-500">*</span></label>
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
                  <p className="mt-1.5 text-sm text-gray-400">ระบบจะบันทึกเป็นรูปแบบ 0XXXXXXXXX</p>
                  {errors.phone && <p className="mt-1.5 text-sm text-red-500">{errors.phone}</p>}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">อีเมล<span className="text-red-500">*</span></label>
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
                  <p className="mt-1.5 text-sm text-gray-400">ใช้สำหรับส่งรายละเอียดการจองและใบยืนยัน</p>
                  {errors.email && <p className="mt-1.5 text-sm text-red-500">{errors.email}</p>}
                </div>
              </div>
            </section>

            <section className="ui-surface rounded-[1.75rem] border border-gray-100 bg-white p-6 md:p-8">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900">รายชื่อผู้เดินทาง</h2>
                <p className="mt-1 text-sm text-gray-500">ระบุชื่อผู้เดินทางทุกท่าน (ไม่บังคับ)</p>
              </div>

              {isPrivate && (
                <div className="mb-6 rounded-[1.25rem] border border-gray-200 bg-gray-50 px-4 py-4 sm:px-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[13px] font-bold text-gray-900 sm:text-sm">กรุณาระบุจำนวนผู้เดินทางจริงเพื่อเตรียมรถ/ที่พัก</span>
                    <span className="text-xs font-bold text-gray-700 bg-gray-100/50 px-2.5 py-1 rounded-full">{adults + children} ท่าน</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-4">
                    <div className="flex items-center justify-between rounded-[1rem] bg-white p-2.5 px-4 shadow-sm border border-gray-100/50">
                      <div>
                        <span className="block text-sm font-bold text-slate-700">ผู้ใหญ่</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setAdults(Math.max(1, adults - 1))} className="ui-focus-ring flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100 font-bold disabled:opacity-40" disabled={adults <= 1}>−</button>
                        <span className="w-5 text-center text-sm font-bold text-slate-900">{adults}</span>
                        <button type="button" onClick={() => { if (adults + children < (tour?.maxPeople || Math.max(tour?.minPeople || 99, 99))) setAdults(adults + 1) }} className="ui-focus-ring flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100 font-bold disabled:opacity-40" disabled={adults + children >= (tour?.maxPeople || Math.max(tour?.minPeople || 99, 99))}>+</button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-[1rem] bg-white p-2.5 px-4 shadow-sm border border-amber-100/50">
                      <div>
                        <span className="block text-sm font-bold text-slate-700">เด็ก</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setChildren(Math.max(0, children - 1))} className="ui-focus-ring flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100 font-bold disabled:opacity-40" disabled={children <= 0}>−</button>
                        <span className="w-5 text-center text-sm font-bold text-slate-900">{children}</span>
                        <button type="button" onClick={() => { if (adults + children < (tour?.maxPeople || Math.max(tour?.minPeople || 99, 99))) setChildren(children + 1) }} className="ui-focus-ring flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100 font-bold disabled:opacity-40" disabled={adults + children >= (tour?.maxPeople || Math.max(tour?.minPeople || 99, 99))}>+</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {travelersInfo.map((traveler, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-sm font-semibold text-gray-500">
                      {index < adults ? `ผู้ใหญ่ ${index + 1}` : `เด็ก ${index - adults + 1}`}
                    </span>
                    <input
                      type="text"
                      className="ui-focus-ring flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-all placeholder:text-gray-300 focus:border-primary focus:bg-white"
                      placeholder="ชื่อ-นามสกุล"
                      value={traveler.name}
                      onChange={(e) => {
                        const next = [...travelersInfo]
                        next[index] = { ...next[index], name: e.target.value }
                        setTravelersInfo(next)
                      }}
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="ui-surface rounded-[1.75rem] border border-gray-100 bg-white p-6 md:p-8">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900">คำขอเพิ่มเติม (หากมี)</h2>
                <p className="mt-1 text-sm text-gray-500">ระบุข้อมูลที่ต้องการให้ทีมงานทราบก่อนเดินทาง</p>
              </div>
              <textarea
                data-testid="special-request"
                rows={4}
                className="ui-focus-ring mt-2 w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 p-4 text-base outline-none transition-all placeholder:text-gray-300 focus:border-primary focus:bg-white"
                placeholder="คำขอพิเศษ"
                value={specialRequest}
                onChange={(event) => setSpecialRequest(event.target.value)}
              />
              <p className="mt-3 text-sm text-gray-400">สามารถระบุข้อมูลเพิ่มเติมที่ต้องการให้ทีมงานรับทราบได้</p>
            </section>

            {errors.form && <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{errors.form}</p>}
          </div>

          <aside className="lg:col-span-5 lg:sticky lg:top-24">
            <BookingSummaryCard
              tourCode={tour?.tourCode || '-'}
              tourName={tour?.name || '-'}
              date={
                <>
                  {formatDate(selectedSchedule?.startDate)}
                  <br />
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

            <button
              type="submit"
              disabled={isSubmitting}
              className={`ui-focus-ring ui-pressable mt-5 w-full rounded-[1.5rem] py-4 text-lg font-bold text-white ${isSubmitting ? 'cursor-not-allowed bg-gray-400 shadow-none hover:transform-none' : 'bg-primary shadow-[0_8px_20px_rgba(37,99,235,0.25)] hover:bg-primary-dark'}`}
            >
              {isSubmitting ? 'กำลังดำเนินการ...' : 'ชำระเงิน'}
            </button>
          </aside>
        </form>
      </main>
    </div>
  )
}

