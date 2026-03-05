import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookingService } from '../services/bookingService'
import ConfirmModal from '../components/common/ConfirmModal'
import { toast } from 'react-hot-toast'

interface MyBookingItem {
  id: number
  tourCode: string
  tourName: string
  date: string
  startDate: string
  endDate: string
  price: number
  adultPrice: number
  childPrice: number
  status: string
  adults: number
  children: number
  image: string
  accommodation: string
  createdAt: string
  paidAt: string
}

export default function MyBookingPage() {
  const [activeTab, setActiveTab] = useState('ทั้งหมด')
  const [bookings, setBookings] = useState<MyBookingItem[]>([])
  const [selectedBooking, setSelectedBooking] = useState<MyBookingItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelModalId, setCancelModalId] = useState<string | null>(null)

  const navigate = useNavigate()

  // 1. เพิ่มแท็บ "ยกเลิกแล้ว"
  const tabs = ['ทั้งหมด', 'รอชำระเงิน', 'รอตรวจสอบ', 'สำเร็จ', 'ยกเลิกแล้ว']

  // ดึงข้อมูลเมื่อโหลดหน้าเว็บ
  useEffect(() => {
    loadBookings()
  }, [])

  // แปลงสถานะจาก Backend (ภาษาอังกฤษ) เป็น UI (ภาษาไทย)
  const mapStatusToThai = (status: string) => {
    switch (status) {
      case 'pending_payment': return 'รอชำระเงิน'
      case 'awaiting_approval': return 'รอตรวจสอบ'
      case 'confirmed': return 'สำเร็จ'
      case 'success': return 'สำเร็จ'
      case 'canceled': return 'ยกเลิกแล้ว'
      case 'refund_pending': return 'รอคืนเงิน'
      case 'refund_completed': return 'คืนเงินสำเร็จ'
      default: return status
    }
  }

  // 2. ฟังก์ชันโหลดข้อมูล จาก API ของจริง
  const loadBookings = async () => {
    try {
      setLoading(true)
      const data = await bookingService.getMyBookings()

      // แปลงข้อมูลจาก Backend ให้เข้ากับ UI
      const formattedBookings = data.map(b => ({
        id: b.id,
        tourCode: b.schedule?.tour?.tourCode || `T-${b.scheduleId}`,
        tourName: b.schedule?.tour?.name || 'Unknown Tour',
        date: `รอบเดินทางอ้างอิง: ${b.scheduleId}`,
        startDate: b.schedule?.startDate || '',
        endDate: b.schedule?.endDate || '',
        price: b.totalPrice,
        adultPrice: b.schedule?.tour?.price || 0,
        childPrice: b.schedule?.tour?.childPrice || 0,
        status: mapStatusToThai(b.status),
        adults: b.adults || b.paxCount || 1,
        children: b.children || 0,
        image: typeof b.schedule?.tour?.images?.[0] === 'string' ? b.schedule.tour.images[0] : (b.schedule?.tour?.images?.[0] as any)?.url || 'https://images.unsplash.com/photo-1528181304800-2f140819898f?auto=format&fit=crop&w=300',
        accommodation: b.schedule?.tour?.accommodation || '',
        createdAt: b.createdAt || '',
        paidAt: b.payments?.[0]?.uploadedAt || '',
      }))

      setBookings(formattedBookings)
    } catch (err) {
      console.error("Error loading my bookings:", err)
      // กรณีดึงข้อมูลไม่ได้ 
    } finally {
      setLoading(false)
    }
  }

  // 3. เรียก API เพื่อยกเลิกรายการจอง
  const handleCancelBooking = async (bookingId: string) => {
    try {
      await bookingService.cancelBooking(bookingId)
      toast.success('ยกเลิกการจองสำเร็จ')
      setCancelModalId(null)
      loadBookings() // โหลดข้อมูลใหม่เพื่อรีเฟรชหน้าจอ
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      console.error("Error canceling booking:", err)
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการยกเลิก กรุณาลองใหม่อีกครั้ง')
      setCancelModalId(null)
    }
  }

  const filteredBookings = activeTab === 'ทั้งหมด'
    ? bookings
    : bookings.filter(b => b.status === activeTab)


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'รอชำระเงิน': return 'bg-yellow-50 text-yellow-600 border border-yellow-200'
      case 'รอตรวจสอบ': return 'bg-orange-50 text-orange-500 border border-orange-100'
      case 'สำเร็จ': return 'bg-green-50 text-green-600 border border-green-200'
      case 'ยกเลิกแล้ว': return 'bg-red-50 text-red-500 border border-red-200' // เพิ่มป้ายสีแดง
      default: return 'bg-gray-50 text-gray-500'
    }
  }

  // ฟังก์ชัน Helper สำหรับ Modal
  const getModalHeaderColor = (status: string) => {
    switch (status) {
      case 'รอชำระเงิน': return 'bg-[#FFC107]'
      case 'รอตรวจสอบ': return 'bg-[#F97316]'
      case 'สำเร็จ': return 'bg-[#10B981]'
      case 'ยกเลิกแล้ว': return 'bg-[#EF4444]' // สีแดง
      default: return 'bg-gray-500'
    }
  }

  const getModalHeaderText = (status: string) => {
    switch (status) {
      case 'รอชำระเงิน': return 'อยู่ระหว่างการรอชำระเงิน'
      case 'รอตรวจสอบ': return 'รอการตรวจสอบ'
      case 'สำเร็จ': return 'ชำระเงินแล้ว'
      case 'ยกเลิกแล้ว': return 'ยกเลิกแล้ว'
      default: return 'สถานะไม่ทราบ'
    }
  }

  return (
    <div className="relative">
      <main className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-black text-gray-800 mb-8">การจองของฉัน</h1>

        <div className="flex gap-4 mb-8 overflow-x-auto pb-2 border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 font-bold text-sm whitespace-nowrap transition-all border-b-2 ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-gray-400 py-16 bg-white rounded-[1.5rem] border border-gray-100">
              <p className="font-bold">กำลังโหลด...</p>
            </div>
          ) : filteredBookings.length > 0 ? filteredBookings.map((booking, index) => (
            <div key={index} className={`bg-white p-5 rounded-[1.5rem] shadow-sm border flex flex-col md:flex-row gap-6 items-center hover:shadow-md transition-all ${booking.status === 'ยกเลิกแล้ว' ? 'border-red-100 opacity-70' : 'border-gray-100'}`}>

              <img src={booking.image} alt="tour" className={`w-full md:w-40 h-28 object-cover rounded-xl ${booking.status === 'ยกเลิกแล้ว' ? 'grayscale' : ''}`} />

              <div className="flex-1 w-full">
                <div className="flex items-center gap-3">
                  <h3 className={`text-lg font-bold ${booking.status === 'ยกเลิกแล้ว' ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{booking.tourName}</h3>
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${getStatusBadge(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>
                <p className="text-xs font-bold text-gray-500 mt-2">{booking.id}</p>
                <p className="text-xs text-gray-500 mt-1">{booking.date}</p>
              </div>

              <div className="w-full md:w-auto flex flex-col items-start md:items-end gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-bold">ยอดที่ต้องชำระ:</span>
                  <span className="text-xl font-black text-gray-800">{booking.price.toLocaleString()}</span>
                  <span className="text-sm font-bold text-gray-800">บาท</span>
                </div>

                <div className="flex gap-2 items-center w-full md:w-auto">

                  {/* ปุ่มรายละเอียด กดดูได้ทุกสถานะ */}
                  <button
                    onClick={() => setSelectedBooking(booking)}
                    className="flex-1 md:flex-none px-6 py-2 bg-white border border-gray-200 text-gray-600 rounded-full text-xs font-bold hover:bg-gray-50 transition-all shadow-sm"
                  >
                    รายละเอียด
                  </button>

                  {/* ปุ่มชำระเงิน/ยกเลิก จะไม่โชว์ถ้ายกเลิกไปแล้ว */}
                  {booking.status === 'รอชำระเงิน' && (
                    <button
                      onClick={() => navigate(`/payment/${booking.id}`)}
                      className="flex-1 md:flex-none px-6 py-2 bg-primary text-white rounded-full text-xs font-bold hover:bg-primary-dark transition-all shadow-sm"
                    >
                      ชำระเงิน
                    </button>
                  )}

                  {['รอชำระเงิน', 'รอตรวจสอบ', 'สำเร็จ'].includes(booking.status) && (
                    <button
                      onClick={() => setCancelModalId(String(booking.id))}
                      className="flex-1 md:flex-none px-6 py-2 bg-white border border-red-200 text-red-500 rounded-full text-xs font-bold hover:bg-red-50 transition-all"
                    >
                      ยกเลิก
                    </button>
                  )}

                </div>
              </div>
            </div>
          )) : (
            <div className="text-center text-gray-400 py-16 bg-white rounded-[1.5rem] border border-gray-100 border-dashed">
              <span className="text-4xl mb-3 block">📄</span>
              <p className="font-bold">ไม่พบรายการ</p>
            </div>
          )}
        </div>
      </main>

      {/* 🌟 Modal / Pop-up รายละเอียดการจอง 🌟 */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl relative animate-[fadeInUp_0.3s_ease-out]">

            {/* Status Header */}
            <div className={`py-3.5 px-6 flex items-center justify-between text-white ${getModalHeaderColor(selectedBooking.status)}`}>
              <span className="font-bold text-sm tracking-wide">{getModalHeaderText(selectedBooking.status)}</span>
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-7 h-7 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white font-bold transition-all text-sm"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="px-7 py-6">

              {/* Booking Metadata */}
              <div className="bg-gray-50 rounded-xl px-5 py-4 mb-6">
                <h4 className="text-sm font-bold text-gray-800 mb-3">ข้อมูลการจอง</h4>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">เลขที่จอง</span>
                    <span className="font-bold text-gray-800">#{selectedBooking.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">วันที่จอง</span>
                    <span className="font-medium text-gray-700">
                      {selectedBooking.createdAt
                        ? new Date(selectedBooking.createdAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
                        : '-'}
                    </span>
                  </div>
                  {selectedBooking.paidAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">ชำระเงินเมื่อ</span>
                      <span className="font-medium text-gray-700">
                        {new Date(selectedBooking.paidAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tour Info */}
              <h3 className="text-base font-bold text-gray-800 mb-4">สรุปข้อมูลของท่าน</h3>

              <div className="border border-gray-200 rounded-xl p-5 mb-6">
                <div className="flex gap-4">
                  {/* Labels */}
                  <div className="flex-1 space-y-3 text-sm text-gray-600 leading-relaxed min-w-0">
                    <div className="flex gap-2">
                      <span className="font-bold text-gray-800 w-28 shrink-0">รหัสทัวร์</span>
                      <span>{selectedBooking.tourCode}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-bold text-gray-800 w-28 shrink-0">ชื่อทัวร์</span>
                      <span>{selectedBooking.tourName}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-bold text-gray-800 w-28 shrink-0">วันที่เดินทาง</span>
                      <span>
                        {selectedBooking.startDate && selectedBooking.endDate
                          ? `${new Date(selectedBooking.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} - ${new Date(selectedBooking.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`
                          : selectedBooking.date}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-bold text-gray-800 w-28 shrink-0">จำนวนผู้เดินทาง</span>
                      <span>ผู้ใหญ่ {selectedBooking.adults}, เด็ก {selectedBooking.children}</span>
                    </div>
                    {selectedBooking.accommodation && (
                      <div className="flex gap-2">
                        <span className="font-bold text-gray-800 w-28 shrink-0">ที่พัก</span>
                        <span>{selectedBooking.accommodation}</span>
                      </div>
                    )}
                  </div>
                  {/* Image */}
                  <img
                    src={selectedBooking.image}
                    alt="tour"
                    className={`w-36 h-28 object-cover rounded-xl shrink-0 shadow border border-gray-100 ${selectedBooking.status === 'ยกเลิกแล้ว' ? 'grayscale' : ''}`}
                  />
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-gray-200 pt-5 mb-5">
                <h4 className="font-bold text-sm text-gray-800 mb-3">รายละเอียดราคา</h4>
                <div className="text-sm space-y-3 text-gray-600">
                  {selectedBooking.adults > 0 && (
                    <div className="flex items-center">
                      <span className="w-16 shrink-0">ผู้ใหญ่</span>
                      <span className="flex-1 text-center text-gray-400">
                        {selectedBooking.adultPrice > 0
                          ? `${selectedBooking.adultPrice.toLocaleString()} × ${selectedBooking.adults}`
                          : `(${selectedBooking.adults} ท่าน)`}
                      </span>
                      <span className="font-bold text-gray-800 w-28 text-right">
                        {selectedBooking.adultPrice > 0
                          ? `${(selectedBooking.adults * selectedBooking.adultPrice).toLocaleString()} บาท`
                          : '-'}
                      </span>
                    </div>
                  )}
                  {selectedBooking.children > 0 && (
                    <div className="flex items-center">
                      <span className="w-16 shrink-0">เด็ก</span>
                      <span className="flex-1 text-center text-gray-400">
                        {selectedBooking.childPrice > 0
                          ? `${selectedBooking.childPrice.toLocaleString()} × ${selectedBooking.children}`
                          : `(${selectedBooking.children} ท่าน)`}
                      </span>
                      <span className="font-bold text-gray-800 w-28 text-right">
                        {selectedBooking.childPrice > 0
                          ? `${(selectedBooking.children * selectedBooking.childPrice).toLocaleString()} บาท`
                          : '-'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-end border-t border-gray-200 pt-5">
                <span className="font-bold text-gray-800 text-base">ยอดที่ต้องชำระ</span>
                <div className="text-right">
                  <span className={`text-4xl font-black ${selectedBooking.status === 'ยกเลิกแล้ว' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {Math.round(selectedBooking.price).toLocaleString()}
                  </span>
                  <span className="text-base font-bold text-gray-800 ml-2">บาท</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex gap-3 w-full mt-7">
                {selectedBooking.status === 'รอชำระเงิน' && (
                  <button
                    onClick={() => {
                      setSelectedBooking(null);
                      navigate(`/payment/${selectedBooking.id}`);
                    }}
                    className="flex-1 bg-primary text-white font-bold py-3.5 rounded-full hover:bg-primary-dark transition-all text-base shadow-lg hover:shadow-xl"
                  >
                    ชำระเงิน
                  </button>
                )}

                {['รอชำระเงิน', 'รอตรวจสอบ', 'สำเร็จ'].includes(selectedBooking.status) && (
                  <button
                    onClick={() => {
                      setSelectedBooking(null);
                      setCancelModalId(String(selectedBooking.id));
                    }}
                    className="flex-1 bg-white border-2 border-red-200 text-red-500 font-bold py-3.5 rounded-full hover:bg-red-50 transition-all text-base shadow-lg hover:shadow-xl"
                  >
                    ยกเลิก
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 🛑 Confirm Cancel Modal 🛑 */}
      <ConfirmModal
        isOpen={cancelModalId !== null}
        title="ยืนยันการยกเลิก"
        message="หากยกเลิกแล้วจะไม่สามารถย้อนกลับได้"
        confirmText="ยืนยันยกเลิก"
        cancelText="ปิดหน้าต่าง"
        confirmStyle="danger"
        onConfirm={() => cancelModalId && handleCancelBooking(cancelModalId)}
        onCancel={() => setCancelModalId(null)}
      />
    </div>
  )
}