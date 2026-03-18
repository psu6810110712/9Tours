import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import Modal from '../../components/common/Modal'
import { adminService, type TourOverview, type TourScheduleOverview } from '../../services/adminService'
import type { Booking } from '../../types/booking'

type OverviewFilter = 'all' | 'available' | 'full'

function formatDate(value: string) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  })
}

function formatMonthLabel(value: string) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('th-TH', {
    month: 'long',
    year: 'numeric',
  })
}

function isSchedulePast(schedule: TourScheduleOverview) {
  const endDate = new Date(schedule.endDate)
  endDate.setHours(23, 59, 59, 999)
  return endDate.getTime() < Date.now()
}

function getVisibleSchedules(schedules: TourScheduleOverview[], showPastSchedules: boolean) {
  if (showPastSchedules) return schedules
  return schedules.filter((schedule) => !isSchedulePast(schedule))
}

function groupSchedulesByMonth(schedules: TourScheduleOverview[]) {
  const groups = new Map<string, { monthKey: string; monthLabel: string; schedules: TourScheduleOverview[] }>()

  schedules.forEach((schedule) => {
    const monthKey = schedule.startDate?.slice(0, 7) || 'unknown'
    const existing = groups.get(monthKey)

    if (existing) {
      existing.schedules.push(schedule)
      return
    }

    groups.set(monthKey, {
      monthKey,
      monthLabel: formatMonthLabel(schedule.startDate),
      schedules: [schedule],
    })
  })

  return Array.from(groups.values()).sort((left, right) => left.monthKey.localeCompare(right.monthKey))
}

function getOccupancyColor(percent: number) {
  if (percent >= 100) {
    return {
      bar: 'bg-red-500',
      text: 'text-red-600',
      badge: 'bg-red-100 text-red-700',
    }
  }

  if (percent >= 70) {
    return {
      bar: 'bg-yellow-400',
      text: 'text-yellow-700',
      badge: 'bg-yellow-100 text-yellow-700',
    }
  }

  return {
    bar: 'bg-green-500',
    text: 'text-green-600',
    badge: 'bg-green-100 text-green-700',
  }
}

function getBookingStatusProps(status: string) {
  switch (status) {
    case 'pending_payment':
      return { label: 'รอชำระเงิน', color: 'bg-orange-100 text-orange-700' }
    case 'awaiting_approval':
      return { label: 'รอตรวจสอบ', color: 'bg-yellow-100 text-yellow-700' }
    case 'confirmed':
    case 'success':
      return { label: 'ยืนยันแล้ว', color: 'bg-green-100 text-green-700' }
    case 'canceled':
    case 'refund_completed':
      return { label: 'ยกเลิก', color: 'bg-gray-100 text-gray-500' }
    default:
      return { label: status, color: 'bg-gray-100 text-gray-500' }
  }
}

export default function AdminTourOverview() {
  const [tours, setTours] = useState<TourOverview[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<OverviewFilter>('all')
  const [expandedTours, setExpandedTours] = useState<Set<number>>(new Set())
  const [showPastSchedules, setShowPastSchedules] = useState(false)

  const [selectedMonthSchedules, setSelectedMonthSchedules] = useState<{
    tourName: string
    monthLabel: string
    schedules: TourScheduleOverview[]
  } | null>(null)

  const [selectedSchedule, setSelectedSchedule] = useState<{
    schedule: TourScheduleOverview
    tourName: string
  } | null>(null)
  const [scheduleBookings, setScheduleBookings] = useState<Booking[]>([])
  const [loadingBookings, setLoadingBookings] = useState(false)

  const loadTours = async (showSuccessToast = false) => {
    try {
      setLoading(true)
      const data = await adminService.getTourOverview()
      setTours(data)
      if (showSuccessToast) toast.success('รีเฟรชข้อมูลแล้ว')
    } catch {
      toast.error('ไม่สามารถโหลดข้อมูลทัวร์ได้')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTours()
  }, [])

  const filteredTours = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return tours.filter((tour) => {
      const matchesSearch = !normalizedSearch
        || tour.name.toLowerCase().includes(normalizedSearch)
        || tour.tourCode.toLowerCase().includes(normalizedSearch)
        || tour.province.toLowerCase().includes(normalizedSearch)

      if (!matchesSearch) return false

      const visibleSchedules = getVisibleSchedules(tour.schedules, showPastSchedules)
      if (filter === 'full') return visibleSchedules.some((schedule) => schedule.availableSeats <= 0)
      if (filter === 'available') return visibleSchedules.some((schedule) => schedule.availableSeats > 0)
      return true
    })
  }, [filter, search, showPastSchedules, tours])

  const totalBooked = tours.reduce((sum, tour) => sum + tour.schedules.reduce((acc, schedule) => acc + schedule.currentBooked, 0), 0)
  const totalCapacity = tours.reduce((sum, tour) => sum + tour.schedules.reduce((acc, schedule) => acc + schedule.maxCapacity, 0), 0)
  const fullSchedules = tours.reduce((sum, tour) => sum + tour.schedules.filter((schedule) => schedule.availableSeats <= 0).length, 0)

  const toggleTour = (tourId: number) => {
    setExpandedTours((prev) => {
      const next = new Set(prev)
      if (next.has(tourId)) next.delete(tourId)
      else next.add(tourId)
      return next
    })
  }

  const handleScheduleClick = async (schedule: TourScheduleOverview, tourName: string) => {
    setSelectedSchedule({ schedule, tourName })
    setLoadingBookings(true)
    setScheduleBookings([])

    try {
      const bookings = await adminService.getBookingsBySchedule(schedule.id)
      setScheduleBookings(bookings)
    } catch {
      toast.error('ไม่สามารถดึงข้อมูลการจองได้')
    } finally {
      setLoadingBookings(false)
    }
  }

  return (
    <main className="mx-auto flex-1 w-full max-w-6xl px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ภาพรวมการจองทัวร์</h1>
          <p className="mt-1 text-sm text-gray-500">ดูเป็นรายเดือนก่อน แล้วค่อยเจาะลงไปรอบการเดินทางของเดือนนั้น</p>
        </div>
        <button
          type="button"
          onClick={() => void loadTours(true)}
          className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-yellow-500"
        >
          รีเฟรช
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="mb-1 text-sm text-gray-500">ที่นั่งที่ถูกจองแล้วทั้งหมด</p>
          <p className="text-3xl font-bold text-gray-800">{totalBooked.toLocaleString()}</p>
          <p className="mt-1 text-xs text-gray-400">จากทั้งหมด {totalCapacity.toLocaleString()} ที่นั่ง</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="mb-1 text-sm text-gray-500">จำนวนทัวร์ทั้งหมด</p>
          <p className="text-3xl font-bold text-gray-800">{tours.length}</p>
          <p className="mt-1 text-xs text-gray-400">ทัวร์ที่ active ในระบบ</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="mb-1 text-sm text-gray-500">รอบที่เต็มแล้ว</p>
          <p className="text-3xl font-bold text-red-500">{fullSchedules}</p>
          <p className="mt-1 text-xs text-gray-400">รอบที่ไม่มีที่นั่งว่างเหลือ</p>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <input
          placeholder="ค้นหาชื่อทัวร์, รหัส, จังหวัด..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="min-w-[18rem] flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
        />
        {(['all', 'available', 'full'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              filter === value ? 'bg-yellow-400 text-white' : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {value === 'all' ? 'ทั้งหมด' : value === 'available' ? 'มีที่ว่าง' : 'เต็มแล้ว'}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowPastSchedules((prev) => !prev)}
          className={`ml-auto rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
            showPastSchedules ? 'border-gray-800 bg-gray-800 text-white' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          {showPastSchedules ? 'แสดงรอบที่ผ่านไปแล้ว' : 'ซ่อนรอบที่ผ่านไปแล้ว'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-gray-400">กำลังโหลด...</div>
      ) : filteredTours.length === 0 ? (
        <div className="flex justify-center py-20 text-gray-400">ไม่พบทัวร์ที่ตรงกับการค้นหา</div>
      ) : (
        <div className="space-y-4">
          {filteredTours.map((tour) => {
            const visibleSchedules = getVisibleSchedules(tour.schedules, showPastSchedules)
            const totalTourBooked = visibleSchedules.reduce((sum, schedule) => sum + schedule.currentBooked, 0)
            const totalTourCapacity = visibleSchedules.reduce((sum, schedule) => sum + schedule.maxCapacity, 0)
            const monthGroups = groupSchedulesByMonth(visibleSchedules)

            return (
              <div key={tour.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div
                  onClick={() => toggleTour(tour.id)}
                  className="flex cursor-pointer items-center gap-4 border-b border-gray-50 px-6 py-4 transition-colors hover:bg-gray-50/60"
                >
                  <div className={`text-gray-400 transition-transform duration-300 ${expandedTours.has(tour.id) ? 'rotate-90' : ''}`}>
                    <span className="text-lg">▶</span>
                  </div>

                  {tour.images[0] ? (
                    <img src={tour.images[0]} alt={tour.name} className="h-14 w-14 flex-shrink-0 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-2xl">🗺️</div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate font-semibold text-gray-800">{tour.name}</h2>
                      {!tour.isActive && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">ปิดใช้งาน</span>}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {tour.tourCode} • {tour.province} • {tour.totalSchedules} รอบ
                    </p>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <p className="text-lg font-bold text-gray-800">
                      {totalTourBooked}
                      <span className="text-sm font-normal text-gray-400">/{totalTourCapacity} ที่</span>
                    </p>
                    <p className="text-xs text-gray-400">รวมทุกเดือน</p>
                  </div>
                </div>

                {expandedTours.has(tour.id) && (
                  monthGroups.length === 0 ? (
                    <p className="py-4 text-center text-sm italic text-gray-400">
                      {showPastSchedules ? 'ไม่มีรอบในระบบ' : 'ไม่มีรอบที่กำลังจะมาถึง'}
                    </p>
                  ) : (
                    <div className="grid gap-3 bg-gray-50/40 p-4 sm:grid-cols-2 xl:grid-cols-3">
                      {monthGroups.map((group) => {
                        const monthBooked = group.schedules.reduce((sum, schedule) => sum + schedule.currentBooked, 0)
                        const monthCapacity = group.schedules.reduce((sum, schedule) => sum + schedule.maxCapacity, 0)
                        const fullRoundCount = group.schedules.filter((schedule) => schedule.availableSeats <= 0).length

                        return (
                          <button
                            key={`${tour.id}-${group.monthKey}`}
                            type="button"
                            onClick={() => setSelectedMonthSchedules({
                              tourName: tour.name,
                              monthLabel: group.monthLabel,
                              schedules: group.schedules,
                            })}
                            className="rounded-2xl border border-gray-200 bg-white p-4 text-left transition-colors hover:border-yellow-300 hover:bg-yellow-50/40"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-800">{group.monthLabel}</p>
                                <p className="mt-1 text-xs text-gray-400">{group.schedules.length} รอบในเดือนนี้</p>
                              </div>
                              <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600">ดูรอบ</span>
                            </div>

                            <div className="mt-4 space-y-1 text-sm text-gray-600">
                              <p>จองแล้ว {monthBooked.toLocaleString()} / {monthCapacity.toLocaleString()} ที่</p>
                              <p>เต็มแล้ว {fullRoundCount.toLocaleString()} รอบ</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )
                )}
              </div>
            )
          })}
        </div>
      )}

      {selectedMonthSchedules && !selectedSchedule && (
        <Modal isOpen onClose={() => setSelectedMonthSchedules(null)} width="max-w-5xl">
          <button
            type="button"
            onClick={() => setSelectedMonthSchedules(null)}
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700"
          >
            ×
          </button>

          <div className="mb-6">
            <h2 className="mb-1 text-xl font-bold text-gray-800">รอบการเดินทางของเดือน {selectedMonthSchedules.monthLabel}</h2>
            <p className="text-sm text-gray-500">ทัวร์: {selectedMonthSchedules.tourName}</p>
          </div>

          <div className="space-y-3">
            {selectedMonthSchedules.schedules.map((schedule) => {
              const colors = getOccupancyColor(schedule.occupancyPercent)
              const isPast = isSchedulePast(schedule)

              return (
                <button
                  key={schedule.id}
                  type="button"
                  onClick={() => void handleScheduleClick(schedule, selectedMonthSchedules.tourName)}
                  className={`flex w-full items-center gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 text-left transition-colors hover:border-yellow-300 hover:bg-yellow-50/40 ${
                    isPast ? 'opacity-60' : ''
                  }`}
                >
                  <div className="w-48 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800">{schedule.roundName || `รอบ ${schedule.id}`}</p>
                      {isPast && <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-600">จบแล้ว</span>}
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      {formatDate(schedule.startDate)}
                      {schedule.startDate !== schedule.endDate ? ` - ${formatDate(schedule.endDate)}` : ''}
                      {schedule.timeSlot ? ` • ${schedule.timeSlot}` : ''}
                    </p>
                  </div>

                  <div className="flex-1">
                    <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full ${colors.bar}`}
                        style={{ width: `${Math.min(schedule.occupancyPercent, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="w-28 flex-shrink-0 text-right">
                    <span className={`text-sm font-semibold ${colors.text}`}>
                      {schedule.currentBooked}/{schedule.maxCapacity}
                    </span>
                    <span className="text-xs text-gray-400"> ที่</span>
                  </div>

                  <div className="w-24 flex-shrink-0 text-right">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors.badge}`}>
                      {schedule.availableSeats <= 0 ? 'เต็มแล้ว' : `ว่าง ${schedule.availableSeats}`}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </Modal>
      )}

      {selectedSchedule && (
        <Modal isOpen onClose={() => setSelectedSchedule(null)} width="max-w-5xl">
          <button
            type="button"
            onClick={() => setSelectedSchedule(null)}
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700"
          >
            ×
          </button>

          <div className="mb-6">
            <button
              type="button"
              onClick={() => setSelectedSchedule(null)}
              className="mb-3 inline-flex items-center rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              ย้อนกลับ
            </button>
            <h2 className="mb-1 text-xl font-bold text-gray-800">รายชื่อผู้จองในรอบนี้</h2>
            <p className="text-sm text-gray-500">
              ทัวร์: {selectedSchedule.tourName} • รอบ: {selectedSchedule.schedule.roundName || `รอบ ${selectedSchedule.schedule.id}`} • {formatDate(selectedSchedule.schedule.startDate)}
            </p>
          </div>

          {loadingBookings ? (
            <div className="flex justify-center py-20 text-gray-400">กำลังโหลดรายชื่อ...</div>
          ) : scheduleBookings.length === 0 ? (
            <div className="flex justify-center rounded-2xl border border-gray-100 bg-gray-50 py-20 text-gray-400">
              ยังไม่มีผู้จองในรอบนี้
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full whitespace-nowrap text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 font-semibold text-gray-600">
                  <tr>
                    <th className="px-6 py-3">ชื่อผู้ติดต่อ</th>
                    <th className="px-6 py-3">อีเมล / เบอร์โทร</th>
                    <th className="px-6 py-3 text-right">จำนวน</th>
                    <th className="px-6 py-3 text-center">สถานะ</th>
                    <th className="px-6 py-3">วันที่จอง</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {scheduleBookings.map((booking) => {
                    const statusProps = getBookingStatusProps(booking.status)

                    return (
                      <tr key={booking.id} className="transition-colors hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-800">{(booking.contactName || booking.user?.name) || '-'}</td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          <div>{booking.contactEmail || booking.user?.email || '-'}</div>
                          <div>{booking.contactPhone || booking.user?.phone || '-'}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-semibold text-gray-800">{booking.paxCount}</span>
                          <span className="ml-1 text-xs text-gray-400">ที่</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusProps.color}`}>
                            {statusProps.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">{formatDate(booking.createdAt)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}
    </main>
  )
}
