import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

// TODO (Session 2): wire GET /bookings/my หลัง backend auth พร้อม
// หน้านี้รอ: ต้อง login ก่อน, แสดง booking tabs (ทั้งหมด/รอ/สำเร็จ/ยกเลิก)

const STATUS_TABS = ['ทั้งหมด', 'รอตรวจสอบ', 'สำเร็จ', 'ยกเลิกแล้ว']

export default function MyBookingsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">การจองของฉัน</h1>

        {/* tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {STATUS_TABS.map((tab, i) => (
            <button
              key={tab}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${i === 0 ? 'border-[#F5A623] text-[#F5A623]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* placeholder state */}
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">📋</div>
          <p className="font-medium text-gray-500 mb-1">ยังไม่มีการจอง</p>
          <p className="text-sm">⏳ รอการพัฒนาระบบ Auth + Booking (Session 2)</p>
        </div>
      </div>

      <Footer />
    </div>
  )
}
