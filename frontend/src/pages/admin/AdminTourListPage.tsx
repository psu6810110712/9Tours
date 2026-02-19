import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

export default function AdminTourListPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto w-full px-8 py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">จัดการทัวร์ทั้งหมด</h1>
          <Link
            to="/admin/tours/new"
            className="bg-[#F5A623] hover:bg-[#E09415] text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-colors"
          >
            + เพิ่มทัวร์ใหม่
          </Link>
        </div>

        {/* ตารางจำลอง (Placeholder) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">
          <p>รายการทัวร์จะแสดงที่นี่ (รอเชื่อมต่อ API)</p>
        </div>
      </div>
      <Footer />
    </div>
  )
}