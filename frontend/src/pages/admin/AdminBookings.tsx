import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import Modal from '../../components/common/Modal'
import { API_BASE_URL } from '../../services/apiBaseUrl'
import { adminService } from '../../services/adminService'
import type { Booking } from '../../types/booking'
import { buildDisplayName } from '../../utils/profileValidation'

const FILTER_TABS = [
  { label: 'ทั้งหมด', value: 'all' },
  { label: 'รอตรวจสอบสลิป', value: 'awaiting_approval' },
  { label: 'พนักงานยืนยันแล้ว', value: 'confirmed' },
  { label: 'ยกเลิกแล้ว', value: 'canceled' },
] as const

type FilterValue = (typeof FILTER_TABS)[number]['value']

function getBookingContactName(booking: Booking) {
  return buildDisplayName(booking.contactPrefix ?? booking.user?.prefix ?? null, booking.contactName ?? booking.user?.name ?? null)
    || booking.user?.name
    || `User ${booking.userId}`
}

function getBookingContactEmail(booking: Booking) {
  return booking.contactEmail ?? booking.user?.email ?? '-'
}

function getBookingContactPhone(booking: Booking) {
  return booking.contactPhone ?? booking.user?.phone ?? '-'
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterValue>('awaiting_approval')
  const [search, setSearch] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const data = await adminService.getAllBookings()
      setBookings(data)
    } catch (error) {
      console.error(error)
      toast.error('ไม่สามารถโหลดข้อมูลการจองได้')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchBookings()
  }, [])

  const handleUpdateStatus = async (status: string) => {
    if (!selectedBooking) return

    try {
      setIsProcessing(true)
      const updatedBooking = await adminService.updateBookingStatus(selectedBooking.id, status)
      toast.success('อัปเดตสถานะสำเร็จ')
      setBookings((prev) => prev.map((booking) => (booking.id === updatedBooking.id ? updatedBooking : booking)))
      setSelectedBooking(null)
    } catch (error) {
      console.error(error)
      toast.error('ไม่สามารถอัปเดตสถานะได้')
    } finally {
      setIsProcessing(false)
    }
  }

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (filter === 'awaiting_approval' && booking.status !== 'awaiting_approval') return false
      if (filter === 'confirmed' && !['confirmed', 'success'].includes(booking.status)) return false
      if (filter === 'canceled' && booking.status !== 'canceled') return false

      if (search.trim()) {
        const term = search.trim().toLowerCase()
        const contactName = getBookingContactName(booking).toLowerCase()
        const contactEmail = getBookingContactEmail(booking).toLowerCase()
        const contactPhone = getBookingContactPhone(booking).toLowerCase()
        const tourCode = booking.schedule?.tour?.tourCode?.toLowerCase() || ''
        return contactName.includes(term)
          || contactEmail.includes(term)
          || contactPhone.includes(term)
          || tourCode.includes(term)
          || booking.id.toString() === term
      }

      return true
    })
  }, [bookings, filter, search])

  const sortedBookings = useMemo(() => {
    return [...filteredBookings].sort((a, b) => {
      if (!sortConfig) return 0

      const { key, direction } = sortConfig
      const multiplier = direction === 'asc' ? 1 : -1

      let aValue: string | number = ''
      let bValue: string | number = ''

      switch (key) {
        case 'id':
          aValue = a.id
          bValue = b.id
          break
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'contactName':
          aValue = getBookingContactName(a).toLowerCase()
          bValue = getBookingContactName(b).toLowerCase()
          break
        case 'tourCode':
          aValue = (a.schedule?.tour?.tourCode || '').toLowerCase()
          bValue = (b.schedule?.tour?.tourCode || '').toLowerCase()
          break
        case 'totalPrice':
          aValue = Number(a.totalPrice)
          bValue = Number(b.totalPrice)
          break
        default:
          return 0
      }

      if (aValue < bValue) return -1 * multiplier
      if (aValue > bValue) return 1 * multiplier
      return 0
    })
  }, [filteredBookings, sortConfig])

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return '↕'
    return sortConfig.direction === 'asc' ? '↑' : '↓'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">รอชำระเงิน</span>
      case 'awaiting_approval':
        return <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">รอตรวจสอบ</span>
      case 'confirmed':
      case 'success':
        return <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">ยืนยันแล้ว</span>
      case 'canceled':
        return <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">ยกเลิกแล้ว</span>
      default:
        return <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">{status}</span>
    }
  }

  return (
    <>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">ตรวจสอบสลิปโอนเงิน</h1>
          <p className="mt-2 text-sm text-gray-500">ตรวจสอบสลิปโอนเงิน ค้นหารายการ และอัปเดตสถานะการจองได้จากหน้านี้</p>
        </div>

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
              placeholder="ค้นหารหัสจอง, ชื่อลูกค้า, อีเมล, เบอร์, ทัวร์..."
              className="ui-focus-ring w-full rounded-2xl border border-gray-300 py-3 pl-9 pr-4 text-sm outline-none focus:border-yellow-400 xl:w-80"
            />
          </div>
        </div>

        {loading ? (
          <p className="py-16 text-center text-gray-400">กำลังโหลดข้อมูลการจอง...</p>
        ) : sortedBookings.length === 0 ? (
          <div className="ui-surface rounded-[1.5rem] border border-gray-100 bg-white px-6 py-16 text-center text-gray-400">ไม่พบรายการ</div>
        ) : (
          <div className="ui-surface overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full table-fixed text-left text-sm">
                <thead className="bg-yellow-50 text-gray-700">
                  <tr>
                    <th className="w-28 cursor-pointer whitespace-nowrap px-5 py-3 font-semibold transition-colors hover:bg-yellow-100" onClick={() => handleSort('id')}>รหัสจอง {getSortIcon('id')}</th>
                    <th className="w-36 cursor-pointer whitespace-nowrap px-5 py-3 font-semibold transition-colors hover:bg-yellow-100" onClick={() => handleSort('createdAt')}>วันที่จอง {getSortIcon('createdAt')}</th>
                    <th className="w-56 cursor-pointer whitespace-nowrap px-5 py-3 font-semibold transition-colors hover:bg-yellow-100" onClick={() => handleSort('contactName')}>ลูกค้า {getSortIcon('contactName')}</th>
                    <th className="w-48 cursor-pointer whitespace-nowrap px-5 py-3 font-semibold transition-colors hover:bg-yellow-100" onClick={() => handleSort('tourCode')}>ทัวร์ {getSortIcon('tourCode')}</th>
                    <th className="w-32 cursor-pointer whitespace-nowrap px-5 py-3 font-semibold transition-colors hover:bg-yellow-100" onClick={() => handleSort('totalPrice')}>ยอดชำระ {getSortIcon('totalPrice')}</th>
                    <th className="w-32 whitespace-nowrap px-5 py-3 font-semibold">สถานะ</th>
                    <th className="w-40 whitespace-nowrap px-5 py-3 text-right font-semibold">ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedBookings.map((booking) => {
                    const hasSlip = Boolean(booking.payments?.[0]?.slipUrl)
                    return (
                      <tr key={booking.id} className="border-t border-gray-100 transition-colors hover:bg-yellow-50/60">
                        <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-800">#{booking.id}</td>
                        <td className="whitespace-nowrap px-5 py-4 text-xs text-gray-500">{new Date(booking.createdAt).toLocaleString('th-TH')}</td>
                        <td className="px-5 py-4 text-gray-600">
                          <p className="truncate font-medium text-gray-800">{getBookingContactName(booking)}</p>
                          <p className="truncate text-xs text-gray-400">{getBookingContactEmail(booking)}</p>
                          <p className="truncate text-xs text-gray-400">{getBookingContactPhone(booking)}</p>
                        </td>
                        <td className="px-5 py-4 text-gray-600">
                          {booking.schedule?.tour?.tourCode || '-'}
                          <br />
                          <span className="text-xs text-gray-400">{booking.paxCount} ท่าน</span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-900">฿{Number(booking.totalPrice).toLocaleString()}</td>
                        <td className="whitespace-nowrap px-5 py-4">{getStatusBadge(booking.status)}</td>
                        <td className="px-5 py-4 text-right">
                          {hasSlip ? (
                            <button
                              type="button"
                              onClick={() => setSelectedBooking(booking)}
                              className="ui-focus-ring ui-pressable rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                            >
                              ดูสลิปโอนเงิน
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">ยังไม่มีสลิป</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <Modal isOpen={selectedBooking !== null} onClose={() => setSelectedBooking(null)} width="max-w-3xl">
        {selectedBooking && (
          <div>
            <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-xl font-bold text-gray-900">ตรวจสอบสลิปโอนเงิน (จอง #{selectedBooking.id})</h2>
              <button type="button" onClick={() => setSelectedBooking(null)} className="ui-focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700">✕</button>
            </div>

            <div className="grid gap-4 rounded-[1.25rem] bg-gray-50 p-4 text-sm md:grid-cols-2">
              <div>
                <p className="text-gray-500">ลูกค้า</p>
                <p className="font-bold text-gray-900">{getBookingContactName(selectedBooking)}</p>
                <p className="text-gray-600">{getBookingContactEmail(selectedBooking)}</p>
                <p className="text-gray-600">{getBookingContactPhone(selectedBooking)}</p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-gray-500">ยอดที่ต้องชำระ</p>
                <p className="text-lg font-bold text-gray-900">฿{Number(selectedBooking.totalPrice).toLocaleString()}</p>
                <p className="text-gray-500">อัปโหลดสลิปเมื่อ</p>
                <p className="font-medium text-gray-800">
                  {selectedBooking.payments?.[0]?.uploadedAt
                    ? new Date(selectedBooking.payments[0].uploadedAt).toLocaleString('th-TH')
                    : '-'}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-[1.25rem] border border-gray-100 bg-slate-50 p-4 text-sm">
              <p className="font-bold text-gray-800">ข้อมูลการจอง</p>
              <p className="mt-2 text-gray-600">ทัวร์: {selectedBooking.schedule?.tour?.name || '-'}</p>
              <p className="text-gray-600">รหัสทัวร์: {selectedBooking.schedule?.tour?.tourCode || '-'}</p>
              <p className="text-gray-600">จำนวนผู้เดินทาง: {selectedBooking.paxCount} ท่าน</p>
            </div>

            {selectedBooking.payments?.[0]?.slipUrl ? (
              <div className="mt-4 flex items-center justify-center overflow-hidden rounded-[1.25rem] border bg-gray-100 p-3">
                <img
                  src={new URL(selectedBooking.payments[0].slipUrl, `${API_BASE_URL}/`).toString()}
                  alt="Payment Slip"
                  className="max-h-[500px] rounded-lg object-contain"
                />
              </div>
            ) : (
              <p className="py-10 text-center text-gray-500">ไม่พบรูปภาพสลิป</p>
            )}

            {selectedBooking.specialRequest && (
              <div className="mt-4 rounded-[1.25rem] border border-orange-100 bg-orange-50 p-4">
                <p className="mb-1 text-sm font-bold text-orange-800">คำขอเพิ่มเติมจากลูกค้า:</p>
                <p className="whitespace-pre-wrap text-sm text-gray-700">{selectedBooking.specialRequest}</p>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                disabled={isProcessing}
                className="ui-focus-ring ui-pressable rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                ปิด
              </button>

              {selectedBooking.status === 'awaiting_approval' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('canceled')}
                    disabled={isProcessing}
                    className="ui-focus-ring ui-pressable rounded-xl bg-red-100 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-200 disabled:opacity-50"
                  >
                    ไม่อนุมัติ/ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus('confirmed')}
                    disabled={isProcessing}
                    className="ui-focus-ring ui-pressable rounded-xl bg-green-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50"
                  >
                    อนุมัติรายการ
                  </button>
                </>
              )}

              {['confirmed', 'success', 'canceled'].includes(selectedBooking.status) && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('awaiting_approval')}
                  disabled={isProcessing}
                  className="ui-focus-ring ui-pressable rounded-xl bg-yellow-100 px-5 py-2.5 text-sm font-semibold text-yellow-700 hover:bg-yellow-200 disabled:opacity-50"
                >
                  เปลี่ยนสถานะกลับเป็น รอตรวจสอบ
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

