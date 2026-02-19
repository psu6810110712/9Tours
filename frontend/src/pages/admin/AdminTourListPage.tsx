import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { tourService } from '../../services/tourService'
import type { Tour } from '../../types/tour'

export default function AdminTourListPage() {
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // โหลดทัวร์ทั้งหมด (รวมที่ปิดใช้งาน) ตอนเปิดหน้า
  useEffect(() => {
    tourService.getAll({ admin: 'true' }).then((data) => {
      setTours(data)
      setLoading(false)
    })
  }, [])

  const handleDelete = async (tour: Tour) => {
    if (!confirm(`ยืนยันการลบ "${tour.name}" ?`)) return
    await tourService.remove(tour.id)
    // ลบออกจาก state เพื่ออัปเดตหน้าจอทันที
    setTours((prev) => prev.filter((t) => t.id !== tour.id))
  }

  if (loading) {
    return <p className="p-8 text-center text-gray-500">กำลังโหลด...</p>
  }

  return (
    <div className="min-h-screen bg-yellow-50">

      {/* แถบหัวข้อ */}
      <div className="bg-yellow-400 px-8 py-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">จัดการทัวร์</h1>
        <button
          onClick={() => navigate('/admin/tours/new')}
          className="bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          + เพิ่มทัวร์
        </button>
      </div>

      {/* ตาราง */}
      <div className="p-8">
        {tours.length === 0 ? (
          <p className="text-center text-gray-500 py-16">ยังไม่มีทัวร์</p>
        ) : (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-yellow-100 text-gray-700">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold">ชื่อทัวร์</th>
                  <th className="text-left px-5 py-3 font-semibold">ประเภท</th>
                  <th className="text-left px-5 py-3 font-semibold">ราคา</th>
                  <th className="text-left px-5 py-3 font-semibold">จังหวัด</th>
                  <th className="text-left px-5 py-3 font-semibold">สถานะ</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {tours.map((tour) => (
                  <tr key={tour.id} className="border-t border-gray-100 hover:bg-yellow-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-gray-800">{tour.name}</td>
                    <td className="px-5 py-4 text-gray-600">
                      {tour.tourType === 'one_day' ? 'วันเดย์ทริป' : 'เที่ยวพร้อมที่พัก'}
                    </td>
                    <td className="px-5 py-4 text-gray-600">{tour.price.toLocaleString()} บาท</td>
                    <td className="px-5 py-4 text-gray-600">{tour.province}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        tour.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {tour.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => navigate(`/admin/tours/${tour.id}/edit`)}
                          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(tour)}
                          className="bg-red-100 hover:bg-red-200 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
