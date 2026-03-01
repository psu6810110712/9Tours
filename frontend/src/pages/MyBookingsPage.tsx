import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { bookingService } from '../services/bookingService'

interface MyBookingItem {
  id: number
  tourName: string
  date: string
  price: number
  status: string
  adults: number
  children: number
  image: string
}

export default function MyBookingPage() {
  const [activeTab, setActiveTab] = useState('ทั้งหมด')
  const [bookings, setBookings] = useState<MyBookingItem[]>([])
  const [selectedBooking, setSelectedBooking] = useState<MyBookingItem | null>(null)
  const [loading, setLoading] = useState(true)

  const navigate = useNavigate()

  // 1. เพิ่มแท็บ "ยกเลิกแล้ว" กลับเข้ามา
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

      // แปลงข้อมูลจาก Backend ให้เข้ากับ UI เดิม
      const formattedBookings = data.map(b => ({
        id: b.id,
        tourName: b.schedule?.tour?.name || 'Unknown Tour',
        date: `รอบเดินทางอ้างอิง: ${b.scheduleId}`,
        price: b.totalPrice,
        status: mapStatusToThai(b.status),
        adults: b.paxCount || 1, // mapping roughly
        children: 0,
<<<<<<< HEAD
        image: typeof b.schedule?.tour?.images?.[0] === 'string' ? b.schedule.tour.images[0] : (b.schedule?.tour?.images?.[0] as any)?.url || 'https://images.unsplash.com/photo-1528181304800-2f140819898f?auto=format&fit=crop&w=300'
=======
        image: b.schedule?.tour?.images?.[0] || 'https://images.unsplash.com/photo-1528181304800-2f140819898f?auto=format&fit=crop&w=300'
>>>>>>> cedece5284d58a4600fc717c1c6619c176e92df6
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
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองนี้? \n(รายการจะถูกเปลี่ยนสถานะเป็นยกเลิกแล้ว)')) {
      try {
        await bookingService.cancelBooking(bookingId)
        alert('ยกเลิกการจองสำเร็จ')
        loadBookings() // โหลดข้อมูลใหม่เพื่อรีเฟรชหน้าจอ
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } }
        console.error("Error canceling booking:", err)
        alert(error.response?.data?.message || 'เกิดข้อผิดพลาดในการยกเลิก กรุณาลองใหม่อีกครั้ง')
      }
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
                    <>
                      <button
                        onClick={() => navigate(`/payment/${booking.id}`)}
                        className="flex-1 md:flex-none px-6 py-2 bg-primary text-white rounded-full text-xs font-bold hover:bg-primary-dark transition-all shadow-sm"
                      >
                        ชำระเงิน
                      </button>
                      <button
                        onClick={() => handleCancelBooking(String(booking.id))}
                        className="flex-1 md:flex-none px-6 py-2 bg-white border border-red-200 text-red-500 rounded-full text-xs font-bold hover:bg-red-50 transition-all"
                      >
                        ยกเลิก
                      </button>
                    </>
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
          <div className="bg-white rounded-[1.5rem] w-full max-w-[380px] overflow-hidden shadow-2xl relative">

            <div className={`py-3 px-4 text-center font-bold text-xs text-white relative ${getModalHeaderColor(selectedBooking.status)}`}>
              <span>{getModalHeaderText(selectedBooking.status)}</span>
              <button
                onClick={() => setSelectedBooking(null)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-black/10 hover:bg-black/20 rounded-full flex items-center justify-center text-white font-bold transition-all"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <h3 className="text-md font-bold text-gray-800 mb-5">สรุปข้อมูลการจองของท่าน</h3>

              <div className="flex gap-3 mb-6">
                <div className="flex-1 space-y-2.5 text-[11px] text-gray-600 leading-tight">
                  <div className="flex"><span className="font-bold text-gray-800 w-16 shrink-0">รหัสทัวร์</span> <span className="text-gray-600">{selectedBooking.id}</span></div>
                  <div className="flex"><span className="font-bold text-gray-800 w-16 shrink-0">ชื่อทัวร์</span> <span className="line-clamp-2 text-gray-600">{selectedBooking.tourName}</span></div>
                  <div className="flex"><span className="font-bold text-gray-800 w-16 shrink-0">วันที่</span> <span className="text-gray-600">{selectedBooking.date}</span></div>
                  <div className="flex"><span className="font-bold text-gray-800 w-16 shrink-0">จำนวน</span> <span className="text-gray-600">ผู้ใหญ่ {selectedBooking.adults || 1}, เด็ก {selectedBooking.children || 0}</span></div>
                </div>
                <img src={selectedBooking.image} alt="tour" className={`w-20 h-24 object-cover rounded-lg shrink-0 shadow-sm border border-gray-100 ${selectedBooking.status === 'ยกเลิกแล้ว' ? 'grayscale' : ''}`} />
              </div>

              <div className="border-t border-gray-100 pt-5 mb-5">
                <h4 className="font-bold text-[11px] text-gray-800 mb-3">รายละเอียดราคา</h4>
                <div className="text-[11px] space-y-2 text-gray-600">
                  {selectedBooking.adults > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="w-16">ผู้ใหญ่</span>
                      <span className="flex-1 text-center text-gray-400">({selectedBooking.adults} ท่าน)</span>
                      <span className="font-bold text-gray-800">คำนวณในยอดรวม</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-end border-t border-gray-100 pt-5 mb-2">
                <span className="font-bold text-gray-800 text-sm">รวมยอด</span>
                <span className={`text-2xl font-black ${selectedBooking.status === 'ยกเลิกแล้ว' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                  {selectedBooking.price.toLocaleString()} <span className="text-sm font-bold">บาท</span>
                </span>
              </div>

              {selectedBooking.status === 'รอชำระเงิน' && (
                <button
                  onClick={() => {
                    setSelectedBooking(null);
                    navigate(`/payment/${selectedBooking.id}`);
                  }}
                  className="w-full mt-6 bg-primary text-white font-bold py-3 rounded-full hover:bg-primary-dark transition-all text-sm shadow-md"
                >
                  ชำระเงิน
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}