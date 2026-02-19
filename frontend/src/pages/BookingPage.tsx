import { useParams, useSearchParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

// TODO (Session 2): wire ระบบจองจริงหลัง backend auth+booking พร้อม
// หน้านี้รอ: POST /bookings, เช็ค scheduleId, คำนวณ totalPrice

export default function BookingPage() {
  const { tourId } = useParams<{ tourId: string }>()
  const [searchParams] = useSearchParams()
  const scheduleId = searchParams.get('scheduleId')
  const adults = searchParams.get('adults') || '1'
  const children = searchParams.get('children') || '0'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="bg-white rounded-2xl shadow-sm p-10">
          <div className="text-5xl mb-4">🏖️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">หน้าจองทัวร์</h1>
          <p className="text-gray-500 mb-6">
            ทัวร์ #{tourId} · กำหนดการ #{scheduleId} · ผู้ใหญ่ {adults} คน · เด็ก {children} คน
          </p>

          {/* progress bar placeholder */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {['กรอกข้อมูล', 'ชำระเงิน', 'สำเร็จ'].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-[#F5A623] text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {i + 1}
                </div>
                <span className={`text-sm ${i === 0 ? 'text-[#F5A623] font-medium' : 'text-gray-400'}`}>{step}</span>
                {i < 2 && <span className="text-gray-200 mx-1">—</span>}
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-4 text-sm text-amber-700 inline-block">
            ⏳ รอการพัฒนาระบบ Auth + Booking (Session 2)
          </div>

          <div className="mt-8">
            <Link
              to={`/tours/${tourId}`}
              className="text-sm text-[#F5A623] hover:underline"
            >
              ← กลับไปหน้ารายละเอียดทัวร์
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
