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
    if (Array.isArray(message)) return message.join(' ')
    if (typeof message === 'string' && message.trim()) return message
  }

  if (error instanceof Error && error.message.trim()) return error.message
  return fallback
}

function getTourTypeLabel(tourType: Tour['tourType']) {
  return tourType === 'one_day' ? 'วันเดย์ทริป' : 'แพ็กเกจ'
}

function getTourTypeClasses(tourType: Tour['tourType']) {
  return tourType === 'one_day'
    ? 'bg-blue-50 text-blue-700'
    : 'bg-violet-50 text-violet-700'
}

function formatPrice(price: number) {
  return `${Number(price || 0).toLocaleString()} บาท`
}

function formatDate(value: string) {
  if (!value) return 'ยังไม่มีรอบถัดไป'
  return new Date(value).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getNextScheduleDate(tour: Tour) {
  const now = new Date()
  const nextSchedule = [...(tour.schedules || [])]
    .filter((schedule) => new Date(schedule.endDate || schedule.startDate) >= now)
    .sort((left, right) => left.startDate.localeCompare(right.startDate))[0]

  return nextSchedule?.startDate || ''
}

function getScheduleSummary(tour: Tour) {
  const schedules = tour.schedules || []
  return {
    totalSchedules: schedules.length,
    totalCapacity: schedules.reduce((sum, schedule) => sum + (schedule.maxCapacity || 0), 0),
    totalBooked: schedules.reduce((sum, schedule) => sum + (schedule.currentBooked || 0), 0),
  }
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
      toast.success('ลบทัวร์ถาวรสำเร็จ')
      setDeleteModalTour(null)
    } catch (deleteError) {
      toast.error(getApiErrorMessage(deleteError, 'ไม่สามารถลบทัวร์ถาวรได้ กรุณาลองใหม่อีกครั้ง'))
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

      if (!search.trim()) return true

      const term = search.trim().toLowerCase()
      return tour.name.toLowerCase().includes(term)
        || tour.province.toLowerCase().includes(term)
        || (tour.tourCode || '').toLowerCase().includes(term)
    })
  }, [filter, search, tours])

  const stats = useMemo(() => ({
    total: tours.length,
    active: tours.filter((tour) => tour.isActive).length,
    inactive: tours.filter((tour) => !tour.isActive).length,
    oneDay: tours.filter((tour) => tour.tourType === 'one_day').length,
  }), [tours])

  return (
    <>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">จัดการทัวร์</h1>
            <p className="mt-1 text-sm text-gray-500">จัดการรายการทัวร์จากหน้าเดียวแบบอ่านง่ายและสแกนเร็ว</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/tours/new')}
            className="ui-focus-ring ui-pressable rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-700"
          >
            + เพิ่มทัวร์
          </button>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <p className="text-sm text-gray-500">ทัวร์ทั้งหมด</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <p className="text-sm text-gray-500">ที่เปิดใช้งาน</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">{stats.active}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <p className="text-sm text-gray-500">ที่ปิดใช้งาน</p>
            <p className="mt-2 text-2xl font-bold text-rose-600">{stats.inactive}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <p className="text-sm text-gray-500">วันเดย์ทริป</p>
            <p className="mt-2 text-2xl font-bold text-blue-600">{stats.oneDay}</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-5 rounded-[1.5rem] border border-gray-100 bg-white p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="scrollbar-hide flex gap-2 overflow-x-auto">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setFilter(tab.value)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    filter === tab.value
                      ? 'border-yellow-400 bg-yellow-400 text-gray-900'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-yellow-300'
                  }`}
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
                className="ui-focus-ring w-full rounded-2xl border border-gray-300 py-3 pl-9 pr-4 text-sm outline-none focus:border-yellow-400 xl:w-80"
              />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-400">แสดง {filteredTours.length.toLocaleString()} รายการ</p>
        </div>

        {loading ? (
          <p className="py-16 text-center text-gray-400">กำลังโหลด...</p>
        ) : filteredTours.length === 0 ? (
          <div className="rounded-[1.5rem] border border-gray-100 bg-white px-6 py-16 text-center text-gray-400">
            ไม่พบทัวร์ที่ตรงกับเงื่อนไข
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTours.map((tour) => {
              const summary = getScheduleSummary(tour)
              const nextScheduleDate = getNextScheduleDate(tour)
              const previewImage = tour.images?.[0]

              return (
                <section
                  key={tour.id}
                  className="overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white"
                >
                  <div className="grid gap-0 lg:grid-cols-[180px_minmax(0,1fr)_250px]">
                    <div className="h-40 bg-gray-100 lg:h-full">
                      {previewImage ? (
                        <img
                          src={previewImage}
                          alt={tour.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-4xl text-gray-300">🗺️</div>
                      )}
                    </div>

                    <div className="min-w-0 p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                          {tour.tourCode || `T-${tour.id}`}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getTourTypeClasses(tour.tourType)}`}>
                          {getTourTypeLabel(tour.tourType)}
                        </span>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          tour.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {tour.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                        </span>
                      </div>

                      <h2 className="mt-3 line-clamp-2 text-xl font-semibold text-gray-900">{tour.name}</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        {tour.province} • {formatPrice(tour.price)}
                      </p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-2xl bg-gray-50 px-4 py-3">
                          <p className="text-xs text-gray-500">รอบทั้งหมด</p>
                          <p className="mt-1 text-base font-semibold text-gray-900">{summary.totalSchedules.toLocaleString()} รอบ</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 px-4 py-3">
                          <p className="text-xs text-gray-500">จองแล้วรวม</p>
                          <p className="mt-1 text-base font-semibold text-gray-900">{summary.totalBooked.toLocaleString()} / {summary.totalCapacity.toLocaleString()} ที่</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 px-4 py-3">
                          <p className="text-xs text-gray-500">รอบถัดไป</p>
                          <p className="mt-1 text-base font-semibold text-gray-900">{formatDate(nextScheduleDate)}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 px-4 py-3">
                          <p className="text-xs text-gray-500">อัปเดตล่าสุด</p>
                          <p className="mt-1 text-base font-semibold text-gray-900">
                            {new Date(tour.updatedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>

                    <aside className="flex flex-col justify-between border-t border-gray-100 bg-gray-50/70 p-5 lg:border-l lg:border-t-0">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">การจัดการ</p>
                        <div className="mt-3 flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/tours/${tour.id}/edit`)}
                            className="ui-focus-ring ui-pressable rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-yellow-500"
                          >
                            แก้ไขทัวร์
                          </button>
                          <Link
                            to={`/tours/${tour.id}`}
                            className="ui-focus-ring inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            ดูหน้าเว็บ
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleToggleActive(tour)}
                            className={`ui-focus-ring rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                              tour.isActive
                                ? 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
                                : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                            }`}
                          >
                            {tour.isActive ? 'ปิดใช้งานทัวร์' : 'เปิดใช้งานทัวร์'}
                          </button>
                        </div>
                      </div>

                      <div className="mt-5 border-t border-gray-200 pt-4">
                        <button
                          type="button"
                          onClick={() => setDeleteModalTour(tour)}
                          className="ui-focus-ring w-full rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
                        >
                          ลบถาวร
                        </button>
                      </div>
                    </aside>
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </main>

      <ConfirmModal
        isOpen={deleteModalTour !== null}
        title="ยืนยันการลบทัวร์ถาวร"
        message={`คุณแน่ใจหรือไม่ว่าต้องการลบทัวร์ "${deleteModalTour?.name}" แบบถาวร? หากทัวร์นี้มีประวัติการจอง ระบบจะไม่อนุญาตให้ลบ`}
        confirmText="ยืนยันลบถาวร"
        cancelText="ยกเลิก"
        confirmStyle="danger"
        onConfirm={() => deleteModalTour && handleDelete(deleteModalTour)}
        onCancel={() => setDeleteModalTour(null)}
      />
    </>
  )
}
