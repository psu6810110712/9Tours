import { useEffect, useRef, useState, type ChangeEvent, type MouseEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import BookingSummaryCard from '../components/booking/BookingSummaryCard'
import Modal from '../components/common/Modal'
import ProgressBar from '../components/common/ProgressBar'
import { bookingService } from '../services/bookingService'

interface PaymentPageData {
  id: string | number
  tourCode: string
  tourName: string
  date: string
  price: number
  adults: number
  children: number
  adultPrice: number
  childPrice: number
  status: string
  image: string
  isPrivate: boolean
  createdAt: string
  contactPrefix?: string | null
  contactName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
}

type PaymentPhase = 'active' | 'grace' | 'closed'

const ACTIVE_PAYMENT_WINDOW_SECONDS = 15 * 60
const SLIP_UPLOAD_GRACE_SECONDS = 3 * 60
const TOTAL_SLIP_UPLOAD_WINDOW_SECONDS = ACTIVE_PAYMENT_WINDOW_SECONDS + SLIP_UPLOAD_GRACE_SECONDS

export default function PaymentPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [paymentPhase, setPaymentPhase] = useState<PaymentPhase>('active')
  const [bookingData, setBookingData] = useState<PaymentPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resolveCreatedTime = (rawDate: string) => {
    const now = Date.now()
    const asLocal = new Date(rawDate).getTime()
    const asUtc = new Date(rawDate.endsWith('Z') ? rawDate : `${rawDate}Z`).getTime()

    if (now - asLocal >= 0 && (now - asUtc < 0 || now - asLocal <= now - asUtc)) {
      return asLocal
    }

    if (now - asUtc >= 0) {
      return asUtc
    }

    return now
  }

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        if (!bookingId) return
        const data = await bookingService.getBookingById(bookingId)

        const startDate = data.schedule?.startDate
        const endDate = data.schedule?.endDate
        const formatDate = (value?: string) => value
          ? new Date(value).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
          : '-'

        const dateText = startDate && endDate
          ? `${formatDate(startDate)} - ${formatDate(endDate)}`
          : `อ้างอิงรอบเดินทาง: ${data.scheduleId}`

        setBookingData({
          id: data.id,
          tourCode: data.schedule?.tour?.tourCode || location.state?.tourCode || '-',
          tourName: data.schedule?.tour?.name || location.state?.tourName || 'รายการจอง',
          date: dateText,
          price: Number(data.totalPrice || 0),
          adults: data.adults ?? location.state?.adults ?? (data.paxCount || 1),
          children: data.children ?? location.state?.children ?? 0,
          adultPrice: Number(data.schedule?.tour?.price || 0),
          childPrice: Number(data.schedule?.tour?.childPrice || data.schedule?.tour?.price || 0),
          status: data.status,
          image: typeof data.schedule?.tour?.images?.[0] === 'string'
            ? data.schedule.tour.images[0]
            : location.state?.image || 'https://images.unsplash.com/photo-1528181304800-2f140819898f?auto=format&fit=crop&w=300',
          isPrivate: !!data.schedule?.tour?.minPeople || location.state?.isPrivate || false,
          createdAt: data.createdAt || new Date().toISOString(),
          contactPrefix: data.contactPrefix ?? null,
          contactName: data.contactName ?? null,
          contactEmail: data.contactEmail ?? null,
          contactPhone: data.contactPhone ?? null,
        })
        setLoadError('')
      } catch (error) {
        console.error('Error fetching booking details:', error)
        setLoadError('ไม่สามารถโหลดข้อมูลการชำระเงินได้ กรุณาลองเปิดรายการนี้อีกครั้งจากหน้าการจองของฉัน')
      } finally {
        setLoading(false)
      }
    }

    void fetchBooking()
  }, [bookingId, location.state])

  useEffect(() => {
    if (!bookingData || !bookingId) return

    if (bookingData.status === 'canceled') {
      setTimeLeft(0)
      setPaymentPhase('closed')
      return
    }

    const createdTime = bookingData.createdAt ? resolveCreatedTime(bookingData.createdAt) : Date.now()
    const paymentDeadline = createdTime + (ACTIVE_PAYMENT_WINDOW_SECONDS * 1000)
    const uploadDeadline = createdTime + (TOTAL_SLIP_UPLOAD_WINDOW_SECONDS * 1000)

    const updateTimer = () => {
      const now = Date.now()

      if (now < paymentDeadline) {
        setPaymentPhase('active')
        setTimeLeft(Math.max(0, Math.floor((paymentDeadline - now) / 1000)))
        return
      }

      if (now < uploadDeadline) {
        setPaymentPhase('grace')
        setTimeLeft(Math.max(0, Math.floor((uploadDeadline - now) / 1000)))
        return
      }

      setPaymentPhase('closed')
      setTimeLeft(0)
    }

    updateTimer()
    const timerInterval = setInterval(updateTimer, 1000)
    return () => clearInterval(timerInterval)
  }, [bookingData, bookingId])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '--:--'
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0]) return

    const file = event.target.files[0]
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleRemoveFile = (event: MouseEvent) => {
    event.stopPropagation()
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRestartBooking = async () => {
    try {
      if (bookingId && bookingData?.status !== 'canceled') {
        await bookingService.cancelBooking(bookingId)
      }
    } catch {
      // หากยกเลิกไม่ได้ Cron Job จะจัดการให้ภายหลัง
    }

    navigate('/')
  }

  const handleConfirmPayment = async () => {
    if (paymentPhase === 'closed') {
      toast.error('หมดเวลารับสลิปแล้ว กรุณากลับไปจองใหม่ครับ')
      return
    }

    if (!selectedFile) {
      toast.error('กรุณาแนบหลักฐานการชำระเงินก่อนยืนยันครับ')
      return
    }

    if (!bookingId || !bookingData) {
      toast.error('ไม่พบข้อมูลการจอง')
      return
    }

    setIsSubmitting(true)

    try {
      await bookingService.uploadPaymentSlip(
        Number(bookingId),
        bookingData.price,
        selectedFile,
        'BANK_TRANSFER',
      )

      setIsSubmitting(false)
      setShowSuccessModal(true)
    } catch (error: unknown) {
      setIsSubmitting(false)
      const resolvedError = error as { response?: { data?: { message?: string } } }
      toast.error(resolvedError.response?.data?.message || 'ไม่สามารถอัปโหลดสลิปได้ กรุณาลองใหม่อีกครั้ง')
      console.error('Error uploading payment slip:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-lg font-bold text-gray-400">
        กำลังเตรียมข้อมูลการชำระเงิน...
      </div>
    )
  }

  if (loadError || !bookingData) {
    return (
      <div className="bg-[#F8FAFC]">
        <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="ui-surface rounded-[2rem] border border-gray-100 bg-white p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">ไม่พบข้อมูลการชำระเงิน</h1>
            <p className="mt-3 text-sm leading-7 text-gray-500">{loadError}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button type="button" onClick={() => navigate('/my-bookings')} className="ui-focus-ring ui-pressable rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark">
                ไปที่การจองของฉัน
              </button>
              <button type="button" onClick={() => navigate('/')} className="ui-focus-ring ui-pressable rounded-2xl border border-gray-200 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                กลับหน้าแรก
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const paymentSteps = [
    { icon: '/Icon_open_app.svg', text: 'เปิดแอปพลิเคชันธนาคารของคุณ' },
    { icon: '/Icon_scan.svg', text: 'สแกน QR ที่ปรากฏบนหน้าจอ' },
    { icon: '/Icon_check.svg', text: 'ตรวจสอบยอดเงินและชื่อผู้รับ' },
    { icon: '/Icon_ticket.svg', text: 'อัปโหลดภาพสลิปและกดยืนยันการชำระเงิน' },
  ]
  const transferHelpSteps = [
    'ตรวจสอบว่าแอปธนาคารรองรับ QR Payment',
    'โปรดตรวจสอบการเชื่อตออินเทอร์เน็ตของท่านและลองใหม่อีกครั้ง',
    'ติดต่อที่ เพจเฟสบุก 9Tours หรือ Line @9Tours_Travel',
  ]
  const isGraceUploadWindow = paymentPhase === 'grace'
  const isPaymentClosed = paymentPhase === 'closed'
  const paymentBannerTone = isPaymentClosed
    ? 'bg-red-500 text-white'
    : isGraceUploadWindow
      ? 'bg-red-50 text-red-600'
      : 'bg-red-50 text-red-600'
  const paymentBannerMessage = isPaymentClosed
    ? 'ปิดรับการแนบสลิปแล้ว กรุณาจองใหม่อีกครั้ง'
    : isGraceUploadWindow
      ? `กรุณาอัปโหลดสลิปภายใน ${formatTime(timeLeft)} นาที`
      : `กรุณาชำระเงินภายใน ${formatTime(timeLeft)} นาที`

  return (
    <div className="bg-[#F8FAFC]">
      <div className={`${paymentBannerTone} px-4 py-3 text-center text-base font-bold shadow-sm sm:text-lg`}>
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{paymentBannerMessage}</span>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="relative mb-8 mt-2 flex flex-col items-center gap-4 md:gap-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="ui-pressable absolute left-0 top-0 hidden items-center gap-1.5 text-lg font-bold text-primary hover:underline md:flex"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19 3 12m0 0 7-7m-7 7h18" />
            </svg>
            ย้อนกลับ
          </button>
          <ProgressBar currentStep={3} />
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">สแกนเพื่อชำระเงิน</h1>
          <p className="mt-2 text-base text-gray-500">โอนเงินตาม QR ด้านล่าง และอัปโหลดสลิปเพื่อส่งหลักฐานการชำระเงิน</p>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.15fr_1fr]">
          <section className="ui-surface flex h-full flex-col overflow-hidden rounded-[1.65rem] border border-gray-100 bg-white">
            <img
              src="/qr-payment.jpg"
              alt="PromptPay QR Code"
              className="w-full object-contain bg-slate-50 px-5 py-5"
            />
            <div className="border-t border-gray-100 px-5 py-4 text-center">
              <p className="text-base font-medium text-gray-500">ชื่อบัญชี</p>
              <p className="mt-1 text-xl font-bold leading-tight text-gray-800">บริษัท ไนน์ทัวร์ แทรเวล จำกัด</p>
            </div>
            <div className="mt-auto px-5 pb-5">
              <div className="rounded-[1.2rem] border border-gray-100 bg-gray-50/80 p-4 text-left">
                <p className="text-base font-bold text-gray-800">หากท่านพบปัญหาขณะชำระเงิน</p>
                <div className="mt-3 space-y-2.5">
                  {transferHelpSteps.map((step, index) => (
                    <div key={step} className="flex gap-3 text-[15px] leading-6 text-gray-900/85">
                      <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-900">
                        {index + 1}
                      </span>
                      <p>{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <BookingSummaryCard
            tourCode={bookingData.tourCode}
            tourName={bookingData.tourName}
            date={bookingData.date}
            adults={bookingData.adults}
            children={bookingData.children}
            adultPrice={bookingData.adultPrice}
            childPrice={bookingData.childPrice}
            image={bookingData.image}
            totalPrice={bookingData.price}
            isPrivate={bookingData.isPrivate}
            contactPrefix={bookingData.contactPrefix}
            contactName={bookingData.contactName}
            contactEmail={bookingData.contactEmail}
            contactPhone={bookingData.contactPhone}
          />

          <section className="ui-surface flex h-full flex-col rounded-[1.65rem] border border-gray-100 bg-white p-5 md:p-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900">หลักฐานการชำระเงิน</h3>
              <p className="mt-1 text-base text-gray-500">อัปโหลดสลิปและตรวจสอบตัวอย่างก่อนกดยืนยัน</p>
            </div>

            <div
              className={`relative mb-4 overflow-hidden rounded-[1.35rem] border-2 border-dashed transition-all ${previewUrl
                ? 'border-gray-200 bg-gray-50'
                : isPaymentClosed
                  ? 'cursor-not-allowed border-gray-200 bg-gray-100/80'
                  : 'cursor-pointer border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/40'
              }`}
              onClick={() => !previewUrl && !isPaymentClosed && fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="Slip Preview" className="h-[220px] w-full object-contain p-4" />
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="ui-focus-ring absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-red-500 shadow-md transition-colors hover:bg-white hover:text-red-600"
                    title="ลบรูปภาพ"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-gray-900/85 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
                    อัปโหลดไฟล์เรียบร้อย
                  </div>
                </>
              ) : (
                <div className="flex h-[190px] flex-col items-center justify-center px-6 text-center">
                  <svg className="mb-3 h-11 w-11 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="text-lg font-bold text-gray-800">คลิกเพื่ออัปโหลดสลิป</p>
                  <p className="mt-1 text-base text-gray-500">รองรับไฟล์ JPG และ PNG</p>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg, image/png, image/jpg"
                onChange={handleFileChange}
                disabled={isPaymentClosed}
              />
            </div>

            {isGraceUploadWindow && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5">
                <p className="text-base text-xl  text-center font-bold text-red-600">โปรดแนบสลิปภายใน {formatTime(timeLeft)} นาที</p>              </div>
            )}

            <div className="rounded-[1.3rem] border border-gray-100 bg-gray-50 p-3.5">
              <p className="mb-3 text-lg font-bold text-gray-800">ขั้นตอนการชำระเงิน</p>
              <div className="space-y-3 text-gray-700">
                {paymentSteps.map((step, index) => (
                  <div key={index} className="flex items-center gap-3 rounded-[1.05rem] bg-white px-3.5 py-2.5">
                    <img src={step.icon} alt={`Step ${index + 1}`} className="h-7 w-7 shrink-0 object-contain" />
                    <p className="text-base font-medium leading-6">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="mt-10 flex flex-col items-center">
          <button
            type="button"
            onClick={handleConfirmPayment}
            disabled={isSubmitting || isPaymentClosed}
            className={`ui-focus-ring ui-pressable flex min-w-[280px] items-center justify-center gap-3 rounded-full px-8 py-4 text-lg font-bold text-white ${isSubmitting || isPaymentClosed
              ? 'cursor-not-allowed bg-gray-400 shadow-none hover:transform-none'
              : 'bg-primary shadow-[0_10px_25px_rgba(37,99,235,0.25)] hover:bg-primary-dark'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4Zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647Z" />
                </svg>
                กำลังดำเนินการ...
              </span>
            ) : (
              <>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5Z" clipRule="evenodd" />
                </svg>
                ยืนยันการชำระเงิน
              </>
            )}
          </button>

          <div className="mt-5 flex gap-4 text-base font-medium text-gray-400">
            <span>ข้อกำหนดและเงื่อนไขการชำระเงิน</span>
            <span>|</span>
            <span>นโยบายความเป็นส่วนตัว</span>
          </div>
        </div>
      </main>

      <Modal isOpen={showSuccessModal} onClose={() => undefined} width="max-w-sm">
        <div className="flex flex-col items-center text-center">
          <div className="mb-7 flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]">
              <svg className="h-9 w-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-800">การชำระเงินเสร็จสิ้น</h2>
          <p className="mt-3 text-[15px] font-medium leading-relaxed text-gray-500">
            คุณสามารถตรวจสอบสถานะการจองได้
            <br />
            จากหน้าการจองของฉัน
          </p>
          <button
            type="button"
            onClick={() => navigate('/my-bookings')}
            className="ui-focus-ring ui-pressable mt-8 w-full rounded-full bg-primary py-4 text-lg font-bold text-white hover:bg-primary-dark"
          >
            การจองของฉัน
          </button>
        </div>
      </Modal>

      <Modal isOpen={isPaymentClosed && !showSuccessModal} onClose={() => undefined} width="max-w-sm">
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-[1.75rem] font-bold text-gray-800">หมดเวลารับสลิปแล้ว</h2>
          <div className="mt-2 w-full rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3.5 text-left">
            <p className="text-sm font-semibold text-gray-500">ช่องทางติดต่อทีมงาน</p>
            <div className="mt-2 space-y-1.5 text-[15px] leading-6 text-gray-700">
              <p><span className="font-semibold text-gray-900">โทรศัพท์:</span> 095-0323782</p>
              <p><span className="font-semibold text-gray-900">แชต:</span> Line Official หรือ Facebook</p>
            </div>
          </div>

          <div className="mt-5 flex w-full flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                void handleRestartBooking()
              }}
              className="ui-focus-ring ui-pressable w-full rounded-full bg-primary py-3.5 text-lg font-bold text-white hover:bg-primary-dark"
            >
              กลับไปจองใหม่
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
