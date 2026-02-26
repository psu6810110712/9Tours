import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { tourService } from '../services/tourService'
import { bookingService } from '../services/bookingService'

export default function BookingInfoPage() {
  const { tourId } = useParams<{ tourId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // 1. ดึงข้อมูลจาก URL
  const [adults] = useState(parseInt(searchParams.get('adults') || '1'))
  const [children] = useState(parseInt(searchParams.get('children') || '0'))
  const scheduleId = searchParams.get('scheduleId') || '-'

  const [formData, setFormData] = useState({
    prefix: 'นาย', fullName: '', phoneCode: '+66', phone: '', email: '', specialRequest: '', useAccountInfo: 'yes'
  })

  // 2. State สำหรับเก็บข้อมูลทัวร์ของจริงจาก Database
  const [tour, setTour] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // 3. ดึงข้อมูลทัวร์
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
      <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center font-bold text-gray-400">
          กำลังเตรียมข้อมูลการจอง...
        </div>
        <Footer />
      </div>
    )
  }

  // 4. คำนวณราคา
  const adultPrice = tour?.price || 0
  const childPrice = tour?.childPrice !== undefined ? tour.childPrice : adultPrice
  const totalAdultPrice = adults * adultPrice
  const totalChildPrice = children * childPrice
  const totalPrice = totalAdultPrice + totalChildPrice

  // รูปภาพ
  const tourImage = tour?.images && tour.images.length > 0
    ? (typeof tour.images[0] === 'string' ? tour.images[0] : tour.images[0].url)
    : 'https://images.unsplash.com/photo-1528181304800-2f140819898f?auto=format&fit=crop&w=300'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (scheduleId === '-') {
      alert('กรุณาเลือกรอบเดินทางที่ต้องการ')
      return
    }

    try {
      setLoading(true)
      const paxCount = adults + children
      // บันทึกข้อมูลของจริงไปที่ Backend
      const response = await bookingService.createBooking({
        scheduleId: Number(scheduleId),
        paxCount: paxCount
      })

      // แจ้งเตือนผู้ใช้และไปหน้าจ่ายเงิน
      navigate(`/payment/${response.id}`)
    } catch (err: any) {
      console.error("Error creating booking:", err)
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการจอง กรุณาลองใหม่อีกครั้ง')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* --- Header & Progress Bar --- */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 relative">
          <button onClick={() => navigate(-1)} className="text-blue-500 font-medium hover:underline flex items-center gap-1 mb-4 md:mb-0 z-10">
            ← ย้อนกลับ
          </button>
          <div className="flex-1 flex justify-center w-full absolute left-0">
            <div className="flex items-start gap-0 w-full max-w-2xl mx-auto hidden md:flex">
              <div className="flex flex-col items-center relative flex-1">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm z-10">1</div>
                <span className="text-blue-500 text-xs font-bold mt-2">จอง</span>
                <div className="absolute top-4 left-[50%] w-full h-[2px] bg-blue-500"></div>
              </div>
              <div className="flex flex-col items-center relative flex-1">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm z-10">2</div>
                <span className="text-blue-500 text-xs font-bold mt-2">ตรวจสอบข้อมูล</span>
                <div className="absolute top-4 left-[50%] w-full h-[2px] bg-blue-200"></div>
              </div>
              <div className="flex flex-col items-center relative flex-1">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-300 flex items-center justify-center font-bold text-sm z-10">3</div>
                <span className="text-gray-400 text-xs mt-2">ชำระเงิน</span>
                <div className="absolute top-4 left-[50%] w-full h-[2px] bg-blue-100"></div>
              </div>
              <div className="flex flex-col items-center relative flex-1">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-300 flex items-center justify-center font-bold text-sm z-10">4</div>
                <span className="text-gray-400 text-xs mt-2">รับตั๋ว</span>
              </div>
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-6 mt-16 md:mt-0">การจองของท่าน</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ฝั่งซ้าย: ฟอร์มกรอกข้อมูล */}
          <div className="lg:col-span-7 bg-white p-8 rounded-[1.5rem] shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-6">กรอกข้อมูลและตรวจสอบการจอง</h2>
            <div className="bg-white rounded-xl">
              <h3 className="text-md font-bold text-gray-800 mb-4">รายละเอียดการติดต่อ</h3>
              <div className="border border-gray-200 rounded-xl p-6 mb-6 relative mt-4">
                <span className="absolute -top-3 left-4 bg-white px-2 text-sm font-bold text-gray-700">ข้อมูลติดต่อ (สำหรับส่งใบจอง)</span>
                <div className="space-y-5 mt-2">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-1">
                      <label className="block text-xs font-bold text-gray-600 mb-1">คำนำหน้า<span className="text-red-500">*</span></label>
                      <select className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none bg-white" onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}>
                        <option>นาย</option><option>นาง</option><option>นางสาว</option>
                      </select>
                    </div>
                    <div className="md:col-span-3">
                      <label htmlFor="fullName" className="block text-xs font-bold text-gray-600 mb-1">ชื่อ-นามสกุล<span className="text-red-500">*</span></label>
                      <input
                        id="fullName"
                        name="name"
                        autoComplete="name"
                        required
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                        placeholder="ตามที่ปรากฏอยู่บนบัตรประชาชน"
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone" className="block text-xs font-bold text-gray-600 mb-1">หมายเลขโทรศัพท์<span className="text-red-500">*</span></label>
                      <div className="flex">
                        <select className="p-2.5 border border-gray-300 rounded-l-lg border-r-0 text-sm focus:ring-0 outline-none bg-gray-50"><option value="+66">🇹🇭 +66</option></select>
                        <input
                          id="phone"
                          name="tel"
                          autoComplete="tel"
                          required
                          type="tel"
                          className="w-full p-2.5 border border-gray-300 rounded-r-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                          placeholder="เช่น 0801234567"
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-xs font-bold text-gray-600 mb-1">อีเมล<span className="text-red-500">*</span></label>
                      <input
                        id="email"
                        name="email"
                        autoComplete="email"
                        required
                        type="email"
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                        placeholder="เช่น email@example.com"
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="border border-gray-200 rounded-xl p-6 relative mt-6">
                <span className="absolute -top-3 left-4 bg-white px-2 text-sm font-bold text-gray-700">คำขอเพิ่มเติม (หากมี)</span>
                <textarea rows={3} className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none resize-none mt-2" placeholder="สามารถใส่คำขอพิเศษเพิ่มเติมได้" onChange={(e) => setFormData({ ...formData, specialRequest: e.target.value })}></textarea>
              </div>
            </div>
          </div>

          {/* ฝั่งขวา: Card สรุปการจอง */}
          <aside className="lg:col-span-5 sticky top-10">
            <div className="bg-white p-8 rounded-[1.5rem] shadow-md border border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-6">สรุปข้อมูลการจองของท่าน</h3>

              <div className="flex gap-4 mb-6">
                <div className="flex-1 space-y-2 text-sm text-gray-600">
                  <p><span className="font-bold text-gray-800 w-24 inline-block">รหัสทัวร์</span> {tour.id}</p>
                  <p><span className="font-bold text-gray-800 w-24 inline-block align-top">ชื่อทัวร์</span> <span className="inline-block w-[140px] text-blue-600 font-bold">{tour.name}</span></p>

                  {scheduleId !== '-' && (
                    <p><span className="font-bold text-gray-800 w-24 inline-block">รอบเดินทาง</span> <span className="text-orange-500 font-bold">รหัส {scheduleId}</span></p>
                  )}

                  <p><span className="font-bold text-gray-800 w-24 inline-block">จำนวน</span> ผู้ใหญ่ {adults}, เด็ก {children}</p>
                </div>
                <div className="w-28 shrink-0">
                  <img src={tourImage} alt="Tour" className="w-full h-24 object-cover rounded-xl shadow-sm" />
                </div>
              </div>

              <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 mb-6">
                <h4 className="font-bold text-gray-800 mb-3 text-sm">รายละเอียดราคา</h4>
                <div className="space-y-2 text-sm">
                  {adults > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>ผู้ใหญ่</span>
                      <span>{adultPrice.toLocaleString()} x {adults}</span>
                      <span className="font-medium text-gray-800">{totalAdultPrice.toLocaleString()} บาท</span>
                    </div>
                  )}
                  {children > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>เด็ก</span>
                      <span>{childPrice.toLocaleString()} x {children}</span>
                      <span className="font-medium text-gray-800">{totalChildPrice.toLocaleString()} บาท</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-gray-800">ยอดที่ต้องชำระ</span>
                <span className="text-3xl font-bold text-gray-800">{totalPrice.toLocaleString()} <span className="text-xl font-medium">บาท</span></span>
              </div>

              <button type="submit" className="w-full bg-[#3b82f6] text-white font-bold py-3.5 rounded-full hover:bg-blue-600 transition-all text-lg shadow-md">
                ยืนยันการจอง
              </button>
            </div>
          </aside>
        </form>
      </main>
      <Footer />
    </div>
  )
}