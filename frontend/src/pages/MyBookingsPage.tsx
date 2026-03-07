import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookingService } from '../services/bookingService'
import ConfirmModal from '../components/common/ConfirmModal'
import Modal from '../components/common/Modal'
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
      const formattedBookings = data.map(b => {
        let finalPaidAt = '';
        if (b.payments?.[0]?.uploadedAt) {
          // ดึง raw date ถ้าระบบไม่ได้ใส่ Z ให้
          const rawStr = b.payments[0].uploadedAt;
          const strWithZ = rawStr.endsWith('Z') || rawStr.includes('+') ? rawStr : `${rawStr.replace(' ', 'T')}Z`;

          let pDate = new Date(strWithZ);

          // ตรวจสอบกับ createdAt ว่าล้าหลังผิดมาตราฐาน (7 ชม. time offset bug) หรือไม่
          if (b.createdAt) {
            const cDate = new Date(b.createdAt);
            // เป็นไปไม่ได้ที่เวลาชำระเงินจะ "ก่อน" วันที่จอง ถ้าใช่แปลว่าติดบั๊ก UTC
            if (pDate.getTime() < cDate.getTime()) {
              pDate = new Date(pDate.getTime() + 7 * 60 * 60 * 1000);
            }
          }
          finalPaidAt = pDate.toISOString();
        }

        return {
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
          paidAt: finalPaidAt,
        }
      })

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
      case 'รอชำระเงิน': return 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20'
      case 'รอตรวจสอบ': return 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20'
      case 'สำเร็จ': return 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
      case 'ยกเลิกแล้ว': return 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10'
      default: return 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10'
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
            <div data-testid="my-booking-card" key={index} className={`bg-white p-5 rounded-2xl shadow-sm border flex flex-col md:flex-row gap-5 hover:shadow-md transition-all ${booking.status === 'ยกเลิกแล้ว' ? 'border-red-100 opacity-60' : 'border-gray-100'}`}>

              {/* Tour Image */}
              <div className="w-full md:w-44 h-32 shrink-0">
                <img src={booking.image} alt="tour" className={`w-full h-full object-cover rounded-xl ${booking.status === 'ยกเลิกแล้ว' ? 'grayscale' : ''}`} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="mb-2.5">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide ${getStatusBadge(booking.status)}`}>
                    <svg className="h-1.5 w-1.5 fill-current" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" /></svg>
                    {booking.status}
                  </span>
                </div>

                <h3 className={`text-lg font-bold leading-snug ${booking.status === 'ยกเลิกแล้ว' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                  {booking.tourName}
                </h3>

                <div className="text-sm text-gray-500 mt-1 mb-3 flex items-center gap-2">
                  <span className="font-bold text-gray-400">รหัสทัวร์</span>
                  <span className="font-mono tracking-wide font-semibold">{booking.tourCode}</span>
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-600 font-medium">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                    {booking.startDate && booking.endDate
                      ? `${new Date(booking.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} - ${new Date(booking.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      : booking.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                    ผู้ใหญ่ {booking.adults}, เด็ก {booking.children}
                  </span>
                </div>
              </div>

              {/* Price + Actions */}
              <div className="w-full md:w-auto flex flex-col items-start md:items-end justify-between gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-gray-100 shrink-0">

                {/* Hide price when already paid or under review */}
                {!['สำเร็จ', 'รอตรวจสอบ'].includes(booking.status) && (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs text-gray-400 font-medium">ยอดชำระ</span>
                    <span className={`text-2xl font-black ${booking.status === 'ยกเลิกแล้ว' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                      {Math.round(booking.price).toLocaleString()}
                    </span>
                    <span className={`text-sm font-bold ${booking.status === 'ยกเลิกแล้ว' ? 'text-gray-400' : 'text-gray-700'}`}>บาท</span>
                  </div>
                )}

                <div className="flex gap-2 items-center w-full md:w-auto mt-auto">
                  <button
                    onClick={() => setSelectedBooking(booking)}
                    className="flex-1 md:flex-none px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-full text-sm font-bold hover:bg-gray-50 transition-all shadow-sm"
                  >
                    รายละเอียด
                  </button>

                  {booking.status === 'รอชำระเงิน' && (
                    <button
                      onClick={() => navigate(`/payment/${booking.id}`)}
                      className="flex-1 md:flex-none px-5 py-2.5 bg-primary text-white rounded-full text-sm font-bold hover:bg-primary-dark transition-all shadow-sm"
                    >
                      ชำระเงิน
                    </button>
                  )}

                  {['รอชำระเงิน', 'รอตรวจสอบ', 'สำเร็จ'].includes(booking.status) && (
                    <button
                      onClick={() => setCancelModalId(String(booking.id))}
                      className="flex-1 md:flex-none px-5 py-2.5 bg-white border border-red-200 text-red-500 rounded-full text-sm font-bold hover:bg-red-50 transition-all"
                    >
                      ยกเลิกการจอง
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
      <Modal isOpen={selectedBooking !== null} onClose={() => setSelectedBooking(null)} width="max-w-xl">
        <div className="flex flex-col">
          {selectedBooking && (
            <>
              {/* Status Header */}
              <div className={`py-4 px-6 -mx-8 -mt-8 mb-6 flex items-center justify-between text-white rounded-t-[2rem] ${getModalHeaderColor(selectedBooking.status)}`}>
                <span className="font-bold text-lg tracking-wide">{getModalHeaderText(selectedBooking.status)}</span>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="w-7 h-7 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white font-bold transition-all text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div>
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
                      <span className="font-semibold text-gray-700">
                        {selectedBooking.createdAt
                          ? new Date(selectedBooking.createdAt).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
                          : '-'}
                      </span>
                    </div>
                    {selectedBooking.paidAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">ชำระเงินเมื่อ</span>
                        <span className="font-semibold text-gray-700">
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
                    <div className="flex-1 space-y-3 text-sm leading-relaxed min-w-0">
                      <div className="flex gap-2">
                        <span className="font-bold text-gray-800 w-28 shrink-0">รหัสทัวร์</span>
                        <span className="font-medium text-gray-700">{selectedBooking.tourCode}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-bold text-gray-800 w-28 shrink-0">ชื่อทัวร์</span>
                        <span className="font-medium text-gray-700">{selectedBooking.tourName}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-bold text-gray-800 w-28 shrink-0">วันที่เดินทาง</span>
                        <span className="font-medium text-gray-700">
                          {selectedBooking.startDate && selectedBooking.endDate
                            ? `${new Date(selectedBooking.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} - ${new Date(selectedBooking.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`
                            : selectedBooking.date}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-bold text-gray-800 w-28 shrink-0">จำนวนผู้เดินทาง</span>
                        <span className="font-medium text-gray-700">ผู้ใหญ่ {selectedBooking.adults}, เด็ก {selectedBooking.children}</span>
                      </div>
                      {selectedBooking.accommodation && (
                        <div className="flex gap-2">
                          <span className="font-bold text-gray-800 w-28 shrink-0">ที่พัก</span>
                          <span className="font-medium text-gray-700">{selectedBooking.accommodation}</span>
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

                {/* Price Breakdown — hide when paid or under review */}
                {!['สำเร็จ', 'รอตรวจสอบ'].includes(selectedBooking.status) && (
                  <>
                    <div className="border-t border-gray-200 pt-5 mb-5">
                      <h4 className="font-bold text-sm text-gray-800 mb-3">รายละเอียดราคา</h4>
                      <div className="text-sm space-y-3">
                        {selectedBooking.adults > 0 && (
                          <div className="flex items-center">
                            <span className="w-16 shrink-0 font-medium text-gray-600">ผู้ใหญ่</span>
                            <span className="flex-1 text-center text-gray-400 font-medium">
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
                            <span className="w-16 shrink-0 font-medium text-gray-600">เด็ก</span>
                            <span className="flex-1 text-center text-gray-400 font-medium">
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
                  </>
                )}

                {/* CTA Buttons */}
                <div className="flex flex-col gap-3 w-full mt-7">
                  <div className="flex gap-3">
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
                        ยกเลิกการจอง
                      </button>
                    )}
                  </div>

                  {['รอชำระเงิน', 'รอตรวจสอบ', 'สำเร็จ'].includes(selectedBooking.status) && (
                    <p className="text-xs text-gray-400 text-center">
                      สามารถยกเลิกได้ก่อนวันเดินทางอย่างน้อย 7 วัน
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>

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
