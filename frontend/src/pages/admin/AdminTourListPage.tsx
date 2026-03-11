import { useEffect, useMemo, useState } from 'react'
import { isAxiosError } from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import ConfirmModal from '../../components/common/ConfirmModal'
import { tourService } from '../../services/tourService'
import type { Tour } from '../../types/tour'

const FILTER_TABS = [
  { label: 'ทั้งหมด', value: 'all' },
  { label: 'วันเดย์ทริป', value: 'one_day' },
  { label: 'แพ็กเกจ', value: 'package' },
  { label: 'ปิดใช้งาน', value: 'inactive' },
] as const

type FilterValue = (typeof FILTER_TABS)[number]['value']

function getApiErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message
    if (Array.isArray(message)) {
      return message.join(' ')
    }
    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

export default function AdminTourListPage() {
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<FilterValue>('all')
  const [search, setSearch] = useState('')
  const [deleteModalTour, setDeleteModalTour] = useState<Tour | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    setError('')

    tourService.getAll({ admin: 'true' })
      .then((data) => setTours(data))
      .catch((loadError) => setError(getApiErrorMessage(loadError, 'ไม่สามารถโหลดรายการทัวร์ได้')))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (tour: Tour) => {
    try {
      await tourService.remove(tour.id)
      setTours((prev) => prev.filter((item) => item.id !== tour.id))
      toast.success('ลบทัวร์สำเร็จ')
      setDeleteModalTour(null)
    } catch (deleteError) {
      toast.error(getApiErrorMessage(deleteError, 'ไม่สามารถลบทัวร์ได้ กรุณาลองใหม่อีกครั้ง'))
      setDeleteModalTour(null)
    }
  }

  const handleToggleActive = async (tour: Tour) => {
    try {
      const updatedTour = await tourService.update(tour.id, { isActive: !tour.isActive })
      setTours((prev) => prev.map((item) => (item.id === tour.id ? { ...item, isActive: updatedTour.isActive } : item)))
      toast.success(updatedTour.isActive ? 'เปิดใช้งานทัวร์แล้ว' : 'ปิดใช้งานทัวร์แล้ว')
    } catch (toggleError) {
      toast.error(getApiErrorMessage(toggleError, 'ไม่สามารถอัปเดตสถานะทัวร์ได้'))
    }
  }

  const filteredTours = useMemo(() => {
    return tours.filter((tour) => {
      if (filter === 'one_day' && tour.tourType !== 'one_day') return false
      if (filter === 'package' && tour.tourType !== 'package') return false
      if (filter === 'inactive' && tour.isActive) return false
      if (search.trim()) {
        const term = search.trim().toLowerCase()
        return tour.name.toLowerCase().includes(term) || tour.province.toLowerCase().includes(term) || (tour.tourCode || '').toLowerCase().includes(term)
      }
      return true
    })
  }, [filter, search, tours])

  return (
    <>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">จัดการทัวร์</h1>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/tours/new')}
            className="ui-focus-ring ui-pressable rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-700"
          >
            + เพิ่มทัวร์
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="scrollbar-hide flex gap-3 overflow-x-auto">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilter(tab.value)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${filter === tab.value ? 'border-yellow-400 bg-yellow-400 text-gray-900' : 'border-gray-300 bg-white text-gray-600 hover:border-yellow-300'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative xl:ml-auto">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ค้นหาชื่อทัวร์ รหัส หรือจังหวัด"
              className="ui-focus-ring w-full rounded-2xl border border-gray-300 py-3 pl-9 pr-4 text-sm outline-none focus:border-yellow-400 xl:w-72"
            />
          </div>
        </div>

        {loading ? (
          <p className="py-16 text-center text-gray-400">กำลังโหลด...</p>
        ) : filteredTours.length === 0 ? (
          <div className="ui-surface rounded-[1.5rem] border border-gray-100 bg-white px-6 py-16 text-center text-gray-400">ไม่พบทัวร์</div>
        ) : (
          <div className="ui-surface overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-sm">
                <thead className="bg-yellow-50 text-gray-700">
                  <tr>
                    <th className="w-28 px-5 py-3 text-left font-semibold">รหัส</th>
                    <th className="px-5 py-3 text-left font-semibold">ชื่อทัวร์</th>
                    <th className="px-5 py-3 text-left font-semibold">ประเภท</th>
                    <th className="px-5 py-3 text-left font-semibold">จังหวัด</th>
                    <th className="px-5 py-3 text-left font-semibold">ราคา</th>
                    <th className="px-5 py-3 text-left font-semibold">สถานะ</th>
                    <th className="px-5 py-3 text-right font-semibold">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTours.map((tour) => (
                    <tr key={tour.id} className="border-t border-gray-100 transition-colors hover:bg-yellow-50/60">
                      <td className="px-5 py-4 font-mono text-xs text-gray-500">{tour.tourCode}</td>
                      <td className="px-5 py-4 font-medium text-gray-800">{tour.name}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${tour.tourType === 'one_day' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                          {tour.tourType === 'one_day' ? 'วันเดย์ทริป' : 'แพ็กเกจ'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{tour.province}</td>
                      <td className="px-5 py-4 text-gray-600">{Number(tour.price).toLocaleString()} บาท</td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(tour)}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${tour.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                        >
                          {tour.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/tours/${tour.id}/edit`)}
                            className="ui-focus-ring ui-pressable rounded-lg bg-yellow-400 px-3 py-1.5 text-xs font-semibold text-gray-900 hover:bg-yellow-500"
                          >
                            แก้ไข
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteModalTour(tour)}
                            className="ui-focus-ring ui-pressable rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-200"
                          >
                            ลบ
                          </button>
                          <Link to={`/tours/${tour.id}`} className="text-xs text-gray-500 underline transition-colors hover:text-yellow-600">
                            รายละเอียด
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <ConfirmModal
        isOpen={deleteModalTour !== null}
        title="ยืนยันการลบทัวร์"
        message={`คุณแน่ใจหรือไม่ว่าต้องการลบทัวร์ "${deleteModalTour?.name}"? การกระทำนี้ไม่สามารถย้อนกลับได้`}
        confirmText="ยืนยันลบทัวร์"
        cancelText="ยกเลิก"
        confirmStyle="danger"
        onConfirm={() => deleteModalTour && handleDelete(deleteModalTour)}
        onCancel={() => setDeleteModalTour(null)}
      />
    </>
  )
}
