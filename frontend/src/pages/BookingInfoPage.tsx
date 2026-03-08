import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { tourService } from '../services/tourService'
import { bookingService } from '../services/bookingService'

import type { Tour } from '../types/tour'
import { useAuth } from '../context/AuthContext'
import ProgressBar from '../components/common/ProgressBar'
import BookingSummaryCard from '../components/booking/BookingSummaryCard'

export default function BookingInfoPage() {
  const { tourId } = useParams<{ tourId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [adults] = useState(parseInt(searchParams.get('adults') || '1'))
  const [children] = useState(parseInt(searchParams.get('children') || '0'))
  const scheduleId = searchParams.get('scheduleId') || '-'

  const { user } = useAuth()

  const [formData, setFormData] = useState({
    prefix: 'นาย',
    fullName: user?.name || '',
    phoneCode: '+66',
    phone: user?.phone || '',
    email: user?.email || '',
    specialRequest: '',
    useAccountInfo: 'yes'
  })

  // Auto-fill user info when toggling 'useAccountInfo'
  useEffect(() => {
    if (formData.useAccountInfo === 'yes' && user) {
      //  สมาร์ทพาร์สเซอร์ แยกคำนำหน้าออกจากชื่อสำหรับข้อมูลผู้ใช้เก่า
      let parsedPrefix = formData.prefix; // ค่าเริ่มต้น
      let cleanName = user.name || '';

      const prefixPatterns = [
        { pattern: /^(นาย|Mr\.)\s*/i, value: 'นาย' },
        { pattern: /^(นาง|Mrs\.)\s*/i, value: 'นาง' },
        { pattern: /^(นางสาว|Ms\.|Miss)\s*/i, value: 'นางสาว' }
      ];

      for (const p of prefixPatterns) {
        if (p.pattern.test(cleanName)) {
          parsedPrefix = p.value; // พบคำนำหน้าให้เปลี่ยนไปใช้ค่านั้นใน Dropdown ให้ด้วย
          cleanName = cleanName.replace(p.pattern, '').trim(); // ลบคำกําหน้าออกจากช่องชื่อ
          break;
        }
      }

      setFormData(prev => ({
        ...prev,
        prefix: parsedPrefix,     // เลือกคำนำหน้าให้ถูกอิงจากชื่อเดิม
        fullName: cleanName,      //  ชื่อที่ไม่มีคำนำหน้าแล้ว
        email: user.email || '',
        phone: user.phone || ''
      }))
    } else if (formData.useAccountInfo === 'no') {
      setFormData(prev => ({
        ...prev,
        fullName: '',
        email: '',
        phone: ''
      }))
    }
  }, [formData.useAccountInfo, user])

  const [tour, setTour] = useState<Tour | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' })

  useEffect(() => {
    if (tourId) {
      tourService.getOne(Number(tourId))
        .then((data) => {
          setTour(data)
          setLoading(false)
        })
        .catch((err) => {
          console.error("Error fetching tour:", err)
          alert("ไม่พบข้อมูลทัวร์นี้")
          navigate(-1)
        })
    }
  }, [tourId, navigate])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center font-bold text-gray-400 text-lg">
        กำลังเตรียมข้อมูลการจอง...
      </div>
    )
  }

  const adultPrice = tour?.price || 6900
  const childPrice = (tour?.childPrice !== null && tour?.childPrice !== undefined) ? tour.childPrice : adultPrice
  const totalAdultPrice = adults * adultPrice
  const totalChildPrice = children * childPrice
  const totalPrice = totalAdultPrice + totalChildPrice

  // Get selected schedule
  const selectedSchedule = tour?.schedules?.find(s => s.id === Number(scheduleId))
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    const timestamp = Date.parse(dateStr)
    if (isNaN(timestamp)) return dateStr
    return new Date(dateStr).toLocaleDateString('th-TH', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  const tourImage = tour?.images && tour.images.length > 0
    ? (typeof tour.images[0] === 'string' ? tour.images[0] : (tour.images[0] as any).url)
    : 'https://images.unsplash.com/photo-1528181304800-2f140819898f?auto=format&fit=crop&w=300'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (scheduleId === '-') {
      setErrorModal({ isOpen: true, message: 'กรุณาระบุรอบเดินทางที่ต้องการ' })
      return;
    }
    try {
      setIsSubmitting(true)
      const payload = {
        scheduleId: Number(scheduleId),
        paxCount: adults + children,
        adults: adults,
        children: children,
        specialRequest: formData.specialRequest || undefined,
      }
      const response = await bookingService.createBooking(payload);
      // แนบข้อมูลทัวร์ติดตัวไปหน้า Payment ด้วย เพื่อป้องกัน Backend ไม่ส่งกลับมา
      navigate(`/payment/${response.id}`, {
        state: {
          tourCode: tour?.tourCode || '-',
          tourName: tour?.name || 'Loading...',
          image: tourImage,
          adults,
          children,
          isPrivate: !!tour?.minPeople
        }
      })
    } catch (err: unknown) {
      console.error("Error creating booking:", err)
      const error = err as { response?: { data?: { message?: string } } }
      const errorMsg = error.response?.data?.message || 'ไม่สามารถทำการจองได้ กรุณาลองใหม่อีกครั้ง'
      setErrorModal({ isOpen: true, message: errorMsg })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-[#F8FAFC]">

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* --- ส่วนหัว: ปุ่มย้อนกลับ & Progress Bar --- */}
        <div className="relative mb-12 flex justify-center mt-4">
          <button
            onClick={() => navigate(-1)}
            className="absolute left-0 top-0 mt-1 text-primary font-bold hover:underline flex items-center gap-1.5 text-base z-20 transition-all hover:-translate-x-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            ย้อนกลับ
          </button>

          <ProgressBar currentStep={2} />
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-8 mt-10">การจองของท่าน</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ฝั่งซ้าย: ฟอร์มกรอกข้อมูล */}
          <div className="lg:col-span-7 bg-white p-8 md:p-10 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05),0_10px_20px_-2px_rgba(0,0,0,0.03)] border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-8">กรอกข้อมูลและตรวจสอบการจอง</h2>

            <div className="mb-10">
              <h3 className="text-lg font-bold text-gray-800 mb-6">รายละเอียดการติดต่อ</h3>

              <div className="border border-gray-200 rounded-2xl p-6 md:p-8 relative mt-4">
                <span className="absolute -top-[14px] left-6 bg-white px-3 text-[15px] font-bold text-gray-800">
                  ข้อมูลติดต่อ (สำหรับส่งใบจอง)
                </span>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-2">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-bold text-gray-700 mb-2">คำนำหน้า<span className="text-red-500">*</span></label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white transition-all"
                      value={formData.prefix}
                      onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                    >
                      <option>นาย</option><option>นาง</option><option>นางสาว</option>
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-bold text-gray-700 mb-2">ชื่อ-นามสกุล<span className="text-red-500">*</span></label>
                    <input
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-gray-300"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                    <p className="text-sm text-gray-400 mt-2">ตามที่ปรากฏอยู่บนบัตรประชาชน (โดยไม่ต้องมีคำนำหน้าหรืออักษรพิเศษ)</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">หมายเลขโทรศัพท์<span className="text-red-500">*</span></label>
                    <div className="flex">
                      <select className="px-3 py-3 border border-gray-300 rounded-l-xl border-r-0 text-base focus:ring-0 outline-none bg-gray-50">
                        <option value="+66">🇹🇭 +66</option>
                      </select>
                      <input
                        required type="tel"
                        className="w-full px-4 py-3 border border-gray-300 rounded-r-xl text-base focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <p className="text-sm text-gray-400 mt-2">เช่น หมายเลขโทรศัพท์มือถือ 0801234567</p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">อีเมล<span className="text-red-500">*</span></label>
                    <input
                      required type="email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    <p className="text-sm text-gray-400 mt-2">เช่น email@example.com</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-8 mt-8 px-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${formData.useAccountInfo === 'yes' ? 'border-primary' : 'border-gray-400 group-hover:border-blue-400'}`}>
                    {formData.useAccountInfo === 'yes' && <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>}
                  </div>
                  <input type="radio" className="hidden" name="useAccount" value="yes" checked={formData.useAccountInfo === 'yes'} onChange={() => setFormData({ ...formData, useAccountInfo: 'yes' })} />
                  <span className={`text-base font-bold transition-colors ${formData.useAccountInfo === 'yes' ? 'text-primary' : 'text-gray-600 group-hover:text-gray-800'}`}>ใช้ข้อมูลเดียวกับบัญชีที่ฉันเคยสมัครไว้</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${formData.useAccountInfo === 'no' ? 'border-primary' : 'border-gray-400 group-hover:border-blue-400'}`}>
                    {formData.useAccountInfo === 'no' && <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>}
                  </div>
                  <input type="radio" className="hidden" name="useAccount" value="no" checked={formData.useAccountInfo === 'no'} onChange={() => setFormData({ ...formData, useAccountInfo: 'no' })} />
                  <span className={`text-base font-bold transition-colors ${formData.useAccountInfo === 'no' ? 'text-primary' : 'text-gray-600 group-hover:text-gray-800'}`}>กรอกข้อมูลเองทั้งหมด</span>
                </label>
              </div>
            </div>

            <div className="border border-gray-200 rounded-2xl p-6 md:p-8 relative mt-10">
              <span className="absolute -top-[14px] left-6 bg-white px-3 text-[15px] font-bold text-gray-800">
                คำขอเพิ่มเติม (หากมี)
              </span>
              <textarea
                rows={4}
                className="w-full p-4 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-primary outline-none resize-none mt-2 transition-all placeholder:text-gray-300"
                placeholder="คำขอพิเศษ"
                value={formData.specialRequest}
                onChange={(e) => setFormData({ ...formData, specialRequest: e.target.value })}
              ></textarea>
              <p className="text-sm text-gray-400 mt-3">รูปแบบ: ท่านสามารถใช้ภาษาไทยหรือภาษาอังกฤษได้ โดยคำขอจะขึ้นอยู่กับความพร้อมให้บริการของผู้ให้บริการ</p>
            </div>
          </div>

          {/* ฝั่งขวา: Card สรุปการจอง */}
          <aside className="lg:col-span-5 sticky top-10">
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
              isPrivate={!!tour?.minPeople}
            />

            <div className="flex justify-center mt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full text-white font-bold py-4 rounded-2xl transition-all text-lg shadow-[0_8px_20px_rgba(37,99,235,0.25)] ${isSubmitting ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-primary hover:bg-primary-dark hover:-translate-y-1 active:translate-y-0'}`}
              >
                {isSubmitting ? 'กำลังดำเนินการ...' : 'ชำระเงิน'}
              </button>
            </div>
          </aside>
        </form>
      </main>

      {/* --- Error Modal ย้ายมาวางตรงนี้ (ถูกหลัก React 100%) --- */}
      {
        errorModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setErrorModal({ isOpen: false, message: '' })}></div>
            <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm relative z-10 flex flex-col items-center text-center shadow-2xl animate-fade-in-up border border-gray-100">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">ไม่สามารถทำรายการได้</h2>
              <p className="text-gray-500 text-[15px] mb-8 leading-relaxed font-medium">
                {errorModal.message}
              </p>
              <button
                onClick={() => setErrorModal({ isOpen: false, message: '' })}
                className="w-full bg-gray-100 text-gray-700 font-bold py-3.5 rounded-full hover:bg-gray-200 transition-colors text-base"
              >
                ตกลง
              </button>
            </div>
          </div>
        )
      }
    </div >
  )
}