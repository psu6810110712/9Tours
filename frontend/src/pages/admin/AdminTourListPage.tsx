import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'
import { tourService } from '../../services/tourService'
import type { Tour } from '../../types/tour'

// ตัวเลือก tab สำหรับกรองทัวร์
const FILTER_TABS = [
  { label: 'ทั้งหมด', value: 'all' },
  { label: 'วันเดย์ทริป', value: 'one_day' },
  { label: 'แพ็กเกจ', value: 'package' },
  { label: 'ปิดใช้งาน', value: 'inactive' },
] as const

type FilterValue = (typeof FILTER_TABS)[number]['value']

export default function AdminTourListPage() {
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterValue>('all')
  const [search, setSearch] = useState('')
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
    setTours((prev) => prev.filter((t) => t.id !== tour.id))
  }

  // สลับสถานะเปิด/ปิดทัวร์ แล้วอัปเดต state ทันทีโดยไม่ต้อง reload
  const handleToggleActive = async (tour: Tour) => {
    await tourService.update(tour.id, { isActive: !tour.isActive } as any)
    setTours((prev) =>
      prev.map((t) => (t.id === tour.id ? { ...t, isActive: !t.isActive } : t))
    )
  }

  // กรองทัวร์ตาม tab + คำค้นหา
  const filtered = tours.filter((t) => {
    if (filter === 'one_day' && t.tourType !== 'one_day') return false
    if (filter === 'package' && t.tourType !== 'package') return false
    if (filter === 'inactive' && t.isActive) return false
    if (search.trim()) {
      const term = search.trim().toLowerCase()
      return t.name.toLowerCase().includes(term) || t.province.includes(search)
    }
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-8 py-8">
        {/* หัวข้อ + ปุ่มเพิ่มทัวร์ */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">จัดการทัวร์</h1>
          <button
            onClick={() => navigate('/admin/tours/new')}
            className="bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            + เพิ่มทัวร์
          </button>
        </div>

        {/* แถว filter tabs + ค้นหา */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                filter === tab.value
                  ? 'bg-yellow-400 border-yellow-400 text-gray-900'
                  : 'bg-white border-gray-300 text-gray-600 hover:border-yellow-300'
              }`}
            >
              {tab.label}
            </button>
          ))}

          {/* ช่องค้นหา */}
          <div className="relative ml-auto">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหา"
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:border-yellow-400 w-56"
            />
          </div>
        </div>

        {/* ตาราง */}
        {loading ? (
          <p className="text-center text-gray-400 py-16">กำลังโหลด...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-16">ไม่พบทัวร์</p>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-yellow-50 text-gray-700 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold w-20">รหัส</th>
                  <th className="text-left px-5 py-3 font-semibold">ชื่อทัวร์</th>
                  <th className="text-left px-5 py-3 font-semibold">ประเภท</th>
                  <th className="text-left px-5 py-3 font-semibold">จังหวัด</th>
                  <th className="text-left px-5 py-3 font-semibold">ราคา</th>
                  <th className="text-left px-5 py-3 font-semibold">สถานะ</th>
                  <th className="px-5 py-3 font-semibold text-right">จัดการ</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((tour) => (
                  <tr
                    key={tour.id}
                    className="border-t border-gray-100 hover:bg-yellow-50/60 transition-colors"
                  >
                    <td className="px-5 py-4 text-gray-500 font-mono text-xs">{tour.tourCode}</td>
                    <td className="px-5 py-4 font-medium text-gray-800">{tour.name}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        tour.tourType === 'one_day'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-purple-50 text-purple-700'
                      }`}>
                        {tour.tourType === 'one_day' ? 'วันเดย์ทริป' : 'แพ็กเกจ'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{tour.province}</td>
                    <td className="px-5 py-4 text-gray-600">
                      {Number(tour.price).toLocaleString()} บาท
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleToggleActive(tour)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          tour.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-600 hover:bg-red-200'
                        }`}
                      >
                        {tour.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2 justify-end items-center">
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
                        <Link
                          to={`/tours/${tour.id}`}
                          className="text-xs text-gray-500 hover:text-yellow-600 underline"
                        >
                          รายละเอียด
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
