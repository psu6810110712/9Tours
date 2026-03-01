import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { bookingService } from '../services/bookingService'
import ProgressBar from '../components/common/ProgressBar'
import BookingSummaryCard from '../components/booking/BookingSummaryCard'

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
}

export default function PaymentPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  // --- State สำหรับ Timer ---
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [isExpired, setIsExpired] = useState(false)

  // --- State สำหรับข้อมูลและการอัปโหลด ---
  const [bookingData, setBookingData] = useState<PaymentPageData | null>(null)
  const [loading, setLoading] = useState(true)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 1. ระบบดึงข้อมูลการจอง
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        if (!bookingId) return
        const data = await bookingService.getBookingById(bookingId)
        setBookingData({
          id: data.id,
          // ถ้า Backend มีส่งมาให้ใช้ของ Backend ถ้าไม่มีให้ใช้ที่ถือข้ามหน้ามา
          tourCode: data.schedule?.tour?.tourCode || location.state?.tourCode || '-',
          tourName: data.schedule?.tour?.name || location.state?.tourName || 'Loading...',
          date: `อ้างอิงรอบเดินทาง: ${data.scheduleId}`,
          price: data.totalPrice || 0,
          adults: location.state?.adults ?? (data.paxCount || 1),
          children: location.state?.children ?? 0,
          adultPrice: data.schedule?.tour?.price || 0,
          childPrice: data.schedule?.tour?.childPrice || data.schedule?.tour?.price || 0,
          status: data.status,
          image: typeof data.schedule?.tour?.images?.[0] === 'string' ? data.schedule.tour.images[0] : (data.schedule?.tour?.images?.[0] as any)?.url || location.state?.image || 'https://images.unsplash.com/photo-1528181304800-2f140819898f?auto=format&fit=crop&w=300'
        })
      } catch (err) {
        console.error("Error fetching booking details:", err)
        // กรณีดึงข้อมูลไม่สำเร็จ หรือเป็นการ Mock ให้ใส่ข้อมูลจำลองไปก่อน
        setBookingData({
          id: bookingId || '',
          tourCode: 'ATV2026005',
          tourName: 'ทัวร์เกาะพีพีดําน้ำชมปะการัง',
          date: '17 เม.ย. พ.ศ.2569 - 19 เม.ย. พ.ศ.2569',
          price: 4000,
          adults: 2,
          children: 1,
          adultPrice: 1500,
          childPrice: 1000,
          status: 'pending_payment',
          image: 'https://images.unsplash.com/photo-1528181304800-2f140819898f?auto=format&fit=crop&w=300'
        })
      } finally {
        setLoading(false)
      }
    }
    fetchBooking()
  }, [bookingId])

  // 2. ระบบเวลานับถอยหลัง (ใช้ LocalStorage)
  useEffect(() => {
    if (!bookingId) return

    const storageKey = `payment_expiry_${bookingId}`
    let expiryTime = localStorage.getItem(storageKey)

    if (!expiryTime) {
      const newExpiry = (Date.now() + 15 * 60 * 1000).toString()
      localStorage.setItem(storageKey, newExpiry)
      expiryTime = newExpiry
    }

    const updateTimer = () => {
      const now = Date.now()
      const remaining = Math.max(0, Math.floor((parseInt(expiryTime!) - now) / 1000))

      setTimeLeft(remaining)
      if (remaining <= 0) {
        setIsExpired(true)
      }
    }

    updateTimer()
    const timerInterval = setInterval(updateTimer, 1000)

    return () => clearInterval(timerInterval)
  }, [bookingId])

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return '--:--'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  // 3. ฟังก์ชันจัดการไฟล์อัปโหลด (Preview)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // 4. จำลองการส่งข้อมูล (Mock Submit)
  const handleConfirmPayment = () => {
    if (!selectedFile) {
      alert('กรุณาแนบหลักฐานการชำระเงินก่อนยืนยันครับ')
      return
    }

    setIsSubmitting(true)

    setTimeout(() => {
      setIsSubmitting(false)
      setShowSuccessModal(true)
      localStorage.removeItem(`payment_expiry_${bookingId}`)
    }, 1500)
  }

  if (loading || !bookingData) {
    return (
      <div className="flex-1 flex items-center justify-center font-bold text-gray-400 text-lg">
        กำลังเตรียมข้อมูลการชำระเงิน...
      </div>
    )
  }

  // ข้อมูลขั้นตอนการชำระเงิน (Icon images)
  const paymentSteps = [
    { icon: '/Icon_open_app.svg', text: 'เปิดแอปพลิเคชันธนาคารของคุณ' },
    { icon: '/Icon_scan.svg', text: 'สแกน QR ที่ปรากฏบนหน้าจอ' },
    { icon: '/Icon_check.svg', text: 'ตรวจสอบยอดเงินและชื่อผู้รับ' },
    { icon: '/Icon_ticket.svg', text: 'อัปโหลดภาพสลิปและกดปุ่มยืนยันการชำระเงิน' }
  ];

  return (
    <div className="bg-[#F8FAFC] relative">
      {/* แถบแจ้งเตือนเวลา (Full width) */}
      <div className={`${isExpired ? 'bg-red-500 text-white' : 'bg-red-50 text-red-500'} py-3 text-center text-base font-bold flex items-center justify-center gap-2 shadow-sm transition-colors`}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {isExpired
          ? 'หมดเวลาชำระเงิน กรุณาทำรายการจองใหม่อีกครั้ง'
          : `กรุณาชำระเงินภายใน ${formatTime(timeLeft)} นาที`
        }
      </div>

      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* --- ส่วนหัว: ปุ่มย้อนกลับ & Progress Bar --- */}
        <div className="relative mb-12 flex justify-center mt-4">
          <button onClick={() => navigate(-1)} className="absolute left-0 top-0 mt-1 text-primary font-bold hover:underline flex items-center gap-1.5 text-base z-20 transition-all hover:-translate-x-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            ย้อนกลับ
          </button>

          <ProgressBar currentStep={3} />
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-8 mt-10 text-center">สแกนเพื่อชำระเงิน</h1>

        {/* --- 3 Columns Layout (Middle container wider) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr_1fr] xl:grid-cols-[1fr_1.4fr_1fr] gap-6 items-stretch max-w-7xl mx-auto">

          {/* คอลัมน์ 1: QR Code */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col items-center pb-8 h-full">
            <img
              src="/qr-payment.jpg"
              alt="PromptPay QR Code"
              className="w-full h-auto object-contain mb-4"
            />
            <div className="text-center px-6">
              <p className="text-sm font-medium text-gray-500 mb-1.5">ชื่อบัญชี</p>
              <p className="font-bold text-gray-800 text-xl">พัชรพล หมัดสุเด็น</p>
            </div>
          </div>

          {/* คอลัมน์ 2: สรุปข้อมูลการจอง */}
          <div className="h-full flex flex-col">
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
            />
          </div>

          {/* คอลัมน์ 3: อัปโหลดสลิป */}
          <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 h-full flex flex-col">
            <h3 className="text-xl font-bold text-gray-800 mb-8 text-center">หลักฐานการชำระเงิน</h3>

            {/* พื้นที่อัปโหลดไฟล์ */}
            <div
              className={`border-2 border-dashed rounded-3xl relative flex flex-col items-center justify-center mb-8 overflow-hidden transition-all shrink-0
                ${previewUrl ? 'border-gray-200 bg-gray-50 h-[260px]' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer h-[200px] hover:border-blue-400'}
              `}
              onClick={() => !previewUrl && fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="Slip Preview" className="w-full h-full object-contain p-3" />
                  <button
                    onClick={handleRemoveFile}
                    className="absolute top-3 right-3 bg-white/95 text-red-500 p-2.5 rounded-full shadow-md hover:bg-white hover:text-red-600 transition-all z-10"
                    title="ลบรูปภาพ"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/80 text-white px-2 py-2 rounded-full text-sm font-semibold backdrop-blur-sm">
                    อัปโหลดไฟล์เรียบร้อย
                  </div>


                </>
              ) : (
                <>
                  <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="text-base text-gray-800 font-bold mb-1.5">คลิกเพื่ออัปโหลดสลิป</p>
                  <p className="text-sm text-gray-500">โปรดตรวจสอบสลิปก่อนอัพโหลดทุกครั้ง</p>
                </>
              )}

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/jpeg, image/png, image/jpg"
                onChange={handleFileChange}
              />

            </div>

            {/* --- ขั้นตอนการชำระเงิน (Icon images) --- */}
            <div className="flex-grow">
              <p className="font-bold text-gray-800 text-lg mb-6">ขั้นตอนการชำระเงิน</p>
              <div className="space-y-5 text-gray-700">
                {paymentSteps.map((step, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <img
                      src={step.icon}
                      alt={`Step ${index + 1}`}
                      className="w-8 h-8 shrink-0 object-contain"
                    />
                    <p className="text-[15px] font-medium leading-normal">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* ปุ่มยืนยัน */}
        <div className="flex flex-col items-center mt-14">
          <button
            onClick={handleConfirmPayment}
            disabled={isSubmitting || isExpired}
            className={`flex items-center justify-center gap-3 text-white font-bold py-4.5 px-24 rounded-full transition-all text-lg min-w-[340px] shadow-[0_10px_25px_rgba(37,99,235,0.25)] 
              ${isSubmitting || isExpired
                ? 'bg-gray-400 cursor-not-allowed shadow-none'
                : 'bg-primary hover:bg-primary-dark hover:-translate-y-[1.5px] active:translate-y-0'
              }`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                กำลังดำเนินการ...
              </span>
            ) : (
              <>
                <svg className="w-5.5 h-5.5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                </svg>
                ยืนยันการชำระเงิน
              </>
            )}
          </button>

          <div className="flex gap-4 mt-5 text-sm font-medium text-gray-400">
            <a href="#" className="hover:text-gray-600 underline underline-offset-2">ข้อกำหนดและเงื่อนไข</a>
            <span>|</span>
            <a href="#" className="hover:text-gray-600 underline underline-offset-2">นโยบายความเป็นส่วนตัว</a>
          </div>
        </div>

      </main>

      {/* --- Success Modal --- */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { }}></div>
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-sm relative z-10 flex flex-col items-center text-center shadow-2xl animate-fade-in-up border border-gray-100">

            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-8">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-800 mb-3">การชำระเงินเสร็จสิ้น</h2>
            <p className="text-gray-500 text-[15px] mb-10 leading-relaxed font-medium">
              คุณสามารถตรวจสอบสถานะการจองได้<br />โดยกดไปที่การจองของฉัน
            </p>

            <button
              onClick={() => navigate('/my-bookings')}
              className="w-full bg-primary text-white font-bold py-4 rounded-full hover:bg-primary-dark transition-colors shadow-lg text-lg"
            >
              การจองของฉัน
            </button>
          </div>
        </div>
      )}

    </div>
  )
}