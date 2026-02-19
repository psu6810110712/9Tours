import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { tourService } from '../../services/tourService'
import type { Tour } from '../../types/tour'

export default function AdminTourListPage() {
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTours()
  }, [])

  const fetchTours = async () => {
    setLoading(true)
    try {
      const data = await tourService.getAll()
      setTours(data)
    } catch (error) {
      console.error(error)
      alert('ไม่สามารถดึงข้อมูลทัวร์ได้')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบทัวร์: ${name} ?`)) return

    try {
      await tourService.remove(id)
      setTours((prev) => prev.filter((t) => t.id !== id))
      alert('ลบทัวร์สำเร็จ')
    } catch (error) {
      console.error(error)
      alert('เกิดข้อผิดพลาดในการลบทัวร์')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">จัดการทัวร์ทั้งหมด</h1>
          <Link
            to="/admin/tours/new"
            className="bg-[#F5A623] hover:bg-[#E09415] text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-colors shadow-sm"
          >
            + เพิ่มทัวร์ใหม่
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-400">กำลังโหลดข้อมูล...</div>
          ) : tours.length === 0 ? (
            <div className="p-10 text-center text-gray-400">ยังไม่มีข้อมูลทัวร์ในระบบ</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-500">
                    <th className="p-4 w-16 text-center">ID</th>
                    <th className="p-4 w-20">รูปภาพ</th>
                    <th className="p-4 min-w-[200px]">ชื่อทัวร์</th>
                    <th className="p-4">ประเภท</th>
                    <th className="p-4">จังหวัด</th>
                    <th className="p-4 text-right">ราคา (บาท)</th>
                    <th className="p-4 text-center">สถานะ</th>
                    <th className="p-4 text-center w-32">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tours.map((tour) => (
                    <tr key={tour.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 text-center text-sm text-gray-500">#{tour.id}</td>
                      <td className="p-4">
                        <img 
                          src={tour.images[0] || 'https://via.placeholder.com/150'} 
                          alt={tour.name} 
                          className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                        />
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-gray-800 text-sm line-clamp-2">{tour.name}</p>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {tour.tourType === 'one_day' ? 'วันเดย์ทริป' : 'แพ็คเกจ'}
                      </td>
                      <td className="p-4 text-sm text-gray-600">{tour.province}</td>
                      <td className="p-4 text-sm font-semibold text-[#F5A623] text-right">
                        {Number(tour.price).toLocaleString()}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                          tour.isActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {tour.isActive ? 'เปิดให้บริการ' : 'ซ่อน'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* ปุ่มแก้ไข */}
                          <Link
                            to={`/admin/tours/${tour.id}/edit`}
                            className="text-sm px-3 py-1.5 rounded-lg font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            แก้ไข
                          </Link>
                          {/* ปุ่มลบ */}
                          <button
                            onClick={() => handleDelete(tour.id, tour.name)}
                            className="text-sm px-3 py-1.5 rounded-lg font-medium text-red-600 hover:bg-red-50 transition-colors"
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
      
    </div>
  )
}