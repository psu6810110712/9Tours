import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import Modal from '../../components/common/Modal'
import { adminService } from '../../services/adminService'
import { bookingService } from '../../services/bookingService'
import type { Booking } from '../../types/booking'
import { buildDisplayName } from '../../utils/profileValidation'

const FILTER_TABS = [
  { label: 'ทั้งหมด', value: 'all' },
  { label: 'รอตรวจสอบสลิป', value: 'awaiting_approval' },
  { label: 'ยืนยันแล้ว', value: 'confirmed' },
  { label: 'ยกเลิกแล้ว', value: 'canceled' },
] as const

const SORT_OPTIONS = [
  { label: 'จองล่าสุด', value: 'createdAt-desc' },
  { label: 'จองเก่าสุด', value: 'createdAt-asc' },
  { label: 'ยอดชำระสูงสุด', value: 'totalPrice-desc' },
  { label: 'ยอดชำระต่ำสุด', value: 'totalPrice-asc' },
  { label: 'รหัสจองใหม่ไปเก่า', value: 'id-desc' },
  { label: 'ชื่อลูกค้า A-Z', value: 'contactName-asc' },
] as const

type FilterValue = (typeof FILTER_TABS)[number]['value']
type SortValue = (typeof SORT_OPTIONS)[number]['value']
type VerificationTone = 'green' | 'yellow' | 'red' | 'gray'
type VerificationDetailItem = {
  label: string
  value: string
}
type VerificationDetailSection = {
  title: string
  items: VerificationDetailItem[]
}

function getBookingContactName(booking: Booking) {
  return buildDisplayName(
    booking.contactPrefix ?? booking.user?.prefix ?? null,
    booking.contactName ?? booking.user?.name ?? null,
  ) || booking.user?.name || `User ${booking.userId}`
}

function getBookingContactEmail(booking: Booking) {
  return booking.contactEmail ?? booking.user?.email ?? '-'
}

function getBookingContactPhone(booking: Booking) {
  return booking.contactPhone ?? booking.user?.phone ?? '-'
}

function getPrimaryPayment(booking: Booking) {
  return booking.payments?.[0]
}

function getVerificationTone(status?: string): VerificationTone {
  switch (status) {
    case 'verified':
      return 'green'
    case 'duplicate':
    case 'amount_mismatch':
    case 'unreadable':
    case 'failed':
      return 'red'
    case 'pending':
    case 'unavailable':
      return 'yellow'
    default:
      return 'gray'
  }
}

function getVerificationBadge(status?: string) {
  switch (status) {
    case 'verified':
      return 'ตรวจผ่าน'
    case 'duplicate':
      return 'สลิปซ้ำ'
    case 'amount_mismatch':
      return 'ยอดไม่ตรง'
    case 'unreadable':
      return 'อ่านสลิปไม่ได้'
    case 'failed':
      return 'ตรวจไม่สำเร็จ'
    case 'unavailable':
      return 'บริการตรวจไม่พร้อม'
    case 'pending':
      return 'รอตรวจ'
    default:
      return 'ไม่มีข้อมูลตรวจ'
  }
}

function getVerificationClasses(tone: VerificationTone) {
  switch (tone) {
    case 'green':
      return 'border-green-200 bg-green-50 text-green-700'
    case 'yellow':
      return 'border-yellow-200 bg-yellow-50 text-yellow-700'
    case 'red':
      return 'border-red-200 bg-red-50 text-red-700'
    default:
      return 'border-gray-200 bg-gray-50 text-gray-700'
  }
}

function formatCompactDateTime(value?: string) {
  if (!value) return '-'

  return new Date(value).toLocaleString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStatusBadge(status: string) {
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
    case 'refund_pending':
      return <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">รอคืนเงิน</span>
    case 'refund_completed':
      return <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">คืนเงินสำเร็จ</span>
    default:
      return <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">{status}</span>
  }
}

function getSortParts(sortValue: SortValue) {
  const [key, direction] = sortValue.split('-') as [string, 'asc' | 'desc']
  return { key, direction }
}

function getNestedRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function formatVerificationValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'number') return value.toLocaleString('th-TH')
  if (typeof value === 'boolean') return value ? 'ใช่' : 'ไม่ใช่'
  return String(value)
}

function formatVerificationDateTime(value: unknown) {
  if (!value) return '-'

  const raw = String(value).trim()
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) {
    return raw
  }

  return parsed.toLocaleString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function pickFirstValue(...values: unknown[]) {
  return values.find((value) => value !== null && value !== undefined && value !== '')
}

function buildVerificationDetails(raw: unknown): VerificationDetailSection[] {
  const record = getNestedRecord(raw)
  if (!record) return []

  const data = getNestedRecord(record.data)
  const sender = getNestedRecord(data?.sender)
  const receiver = getNestedRecord(data?.receiver)
  const transactionItems: VerificationDetailItem[] = []
  const partyItems: VerificationDetailItem[] = []
  const referenceItems: VerificationDetailItem[] = []
  const extraItems: VerificationDetailItem[] = []

  const pushIfPresent = (
    items: VerificationDetailItem[],
    label: string,
    value: unknown,
    formatter?: (input: unknown) => string,
  ) => {
    if (value === null || value === undefined || value === '') return
    items.push({
      label,
      value: formatter ? formatter(value) : formatVerificationValue(value),
    })
  }

  pushIfPresent(
    transactionItems,
    'สถานะจาก API',
    record.message,
  )
  pushIfPresent(
    transactionItems,
    'เวลาโอน',
    pickFirstValue(data?.dateTime, data?.transDate, data?.transactionDateTime),
    formatVerificationDateTime,
  )
  pushIfPresent(
    transactionItems,
    'จำนวนเงินที่ตรวจได้',
    data?.amount,
    (value) => `${formatVerificationValue(value)} บาท`,
  )
  pushIfPresent(
    transactionItems,
    'ค่าธรรมเนียม',
    pickFirstValue(data?.fee, data?.feeAmount),
    (value) => `${formatVerificationValue(value)} บาท`,
  )
  pushIfPresent(
    transactionItems,
    'รหัสผลตรวจ',
    record.code,
  )

  pushIfPresent(
    partyItems,
    'ชื่อผู้โอน',
    pickFirstValue(
      sender?.displayName,
      sender?.name,
      data?.senderName,
      data?.payerName,
      data?.fromName,
    ),
  )
  pushIfPresent(
    partyItems,
    'ธนาคารผู้โอน',
    pickFirstValue(sender?.bank, sender?.bankName),
  )
  pushIfPresent(
    partyItems,
    'บัญชีผู้โอน',
    pickFirstValue(sender?.account, sender?.accountNo, sender?.accountNumber),
  )
  pushIfPresent(
    partyItems,
    'ชื่อผู้รับ',
    pickFirstValue(
      receiver?.displayName,
      receiver?.name,
      data?.receiverName,
      data?.payeeName,
      data?.toName,
    ),
  )
  pushIfPresent(
    partyItems,
    'ธนาคารผู้รับ',
    pickFirstValue(receiver?.bank, receiver?.bankName),
  )
  pushIfPresent(
    partyItems,
    'บัญชีผู้รับ',
    pickFirstValue(receiver?.account, receiver?.accountNo, receiver?.accountNumber),
  )

  pushIfPresent(
    referenceItems,
    'เลขอ้างอิงธุรกรรม',
    pickFirstValue(
      data?.transRef,
      data?.transactionId,
      data?.referenceId,
    ),
  )
  pushIfPresent(referenceItems, 'Ref 1', data?.ref1)
  pushIfPresent(referenceItems, 'Ref 2', data?.ref2)
  pushIfPresent(referenceItems, 'Ref 3', data?.ref3)

  const decode = typeof data?.decode === 'string' ? data.decode.replace(/\s+/g, ' ').trim() : ''
  if (decode) {
    extraItems.push({
      label: 'ข้อมูลจาก QR',
      value: decode.length > 160 ? `${decode.slice(0, 160)}...` : decode,
    })
  }

  return [
    { title: 'ข้อมูลธุรกรรม', items: transactionItems },
    { title: 'ผู้โอนและผู้รับ', items: partyItems },
    { title: 'เลขอ้างอิง', items: referenceItems },
    { title: 'ข้อมูลเพิ่มเติม', items: extraItems },
  ].filter((section) => section.items.length > 0)
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterValue>('awaiting_approval')
  const [search, setSearch] = useState('')
  const [sortValue, setSortValue] = useState<SortValue>('createdAt-desc')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedSlipUrl, setSelectedSlipUrl] = useState<string>('')
  const [showVerificationRaw, setShowVerificationRaw] = useState(false)

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

  useEffect(() => {
    let revokedUrl = ''

    const loadSlip = async () => {
      const payment = selectedBooking ? getPrimaryPayment(selectedBooking) : null
      if (!selectedBooking || !payment?.id || !payment.slipUrl) {
        setSelectedSlipUrl('')
        return
      }

      try {
        const blob = await bookingService.getProtectedSlipBlob(payment.id)
        revokedUrl = URL.createObjectURL(blob)
        setSelectedSlipUrl(revokedUrl)
      } catch (error) {
        console.error(error)
        setSelectedSlipUrl('')
        toast.error('ไม่สามารถโหลดรูปสลิปได้')
      }
    }

    void loadSlip()

    return () => {
      if (revokedUrl) {
        URL.revokeObjectURL(revokedUrl)
      }
    }
  }, [selectedBooking])

  useEffect(() => {
    setShowVerificationRaw(false)
  }, [selectedBooking])

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
<<<<<<< Updated upstream
      if (filter === 'canceled' && booking.status !== 'canceled') return false
=======
      if (filter === 'refund_requested' && !booking.isRefundRequested && booking.status !== 'refund_pending') return false
      if (filter === 'canceled' && booking.status !== 'canceled' && booking.status !== 'refund_completed') return false
>>>>>>> Stashed changes

      if (!search.trim()) return true

      const term = search.trim().toLowerCase()
      const contactName = getBookingContactName(booking).toLowerCase()
      const contactEmail = getBookingContactEmail(booking).toLowerCase()
      const contactPhone = getBookingContactPhone(booking).toLowerCase()
      const tourCode = booking.schedule?.tour?.tourCode?.toLowerCase() || ''
      const tourName = booking.schedule?.tour?.name?.toLowerCase() || ''

      return contactName.includes(term)
        || contactEmail.includes(term)
        || contactPhone.includes(term)
        || tourCode.includes(term)
        || tourName.includes(term)
        || booking.id.toString() === term
    })
  }, [bookings, filter, search])

  const sortedBookings = useMemo(() => {
    const { key, direction } = getSortParts(sortValue)
    const multiplier = direction === 'asc' ? 1 : -1

    return [...filteredBookings].sort((left, right) => {
      let leftValue: string | number = ''
      let rightValue: string | number = ''

      switch (key) {
        case 'id':
          leftValue = left.id
          rightValue = right.id
          break
        case 'createdAt':
          leftValue = new Date(left.createdAt).getTime()
          rightValue = new Date(right.createdAt).getTime()
          break
        case 'contactName':
          leftValue = getBookingContactName(left).toLowerCase()
          rightValue = getBookingContactName(right).toLowerCase()
          break
        case 'totalPrice':
          leftValue = Number(left.totalPrice)
          rightValue = Number(right.totalPrice)
          break
        default:
          return 0
      }

      if (leftValue < rightValue) return -1 * multiplier
      if (leftValue > rightValue) return 1 * multiplier
      return 0
    })
  }, [filteredBookings, sortValue])

  const stats = useMemo(() => ({
    total: bookings.length,
    awaitingApproval: bookings.filter((booking) => booking.status === 'awaiting_approval').length,
    confirmed: bookings.filter((booking) => ['confirmed', 'success'].includes(booking.status)).length,
    canceled: bookings.filter((booking) => booking.status === 'canceled').length,
  }), [bookings])

  return (
    <>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">จัดการการจอง</h1>
          <p className="mt-1 text-sm text-gray-500">ตรวจสลิป ดูรายละเอียดลูกค้า และอนุมัติหรือยกเลิกรายการได้จากหน้าเดียว</p>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <p className="text-sm text-gray-500">รายการทั้งหมด</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <p className="text-sm text-gray-500">รอตรวจสลิป</p>
            <p className="mt-2 text-2xl font-bold text-yellow-600">{stats.awaitingApproval}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <p className="text-sm text-gray-500">ยืนยันแล้ว</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600">{stats.confirmed}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <p className="text-sm text-gray-500">ยกเลิกแล้ว</p>
            <p className="mt-2 text-2xl font-bold text-rose-600">{stats.canceled}</p>
          </div>
        </div>

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

            <div className="flex flex-col gap-3 xl:ml-auto xl:flex-row">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">🔍</span>
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="ค้นหารหัสจอง ลูกค้า ทัวร์ อีเมล หรือเบอร์"
                  className="ui-focus-ring w-full rounded-2xl border border-gray-300 py-3 pl-9 pr-4 text-sm outline-none focus:border-yellow-400 xl:w-80"
                />
              </div>

              <select
                value={sortValue}
                onChange={(event) => setSortValue(event.target.value as SortValue)}
                className="ui-focus-ring rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-yellow-400"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-400">แสดง {sortedBookings.length.toLocaleString()} รายการ</p>
        </div>

        {loading ? (
          <p className="py-16 text-center text-gray-400">กำลังโหลดข้อมูลการจอง...</p>
        ) : sortedBookings.length === 0 ? (
          <div className="rounded-[1.5rem] border border-gray-100 bg-white px-6 py-16 text-center text-gray-400">ไม่พบรายการ</div>
        ) : (
          <div className="space-y-4">
            {sortedBookings.map((booking) => {
              const payment = getPrimaryPayment(booking)
              const hasSlip = Boolean(payment?.slipUrl)
              const verificationTone = getVerificationTone(payment?.verificationStatus)
              const verificationClasses = getVerificationClasses(verificationTone)

              return (
                <section key={booking.id} className="overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white">
                  <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_250px]">
                    <div className="p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                          จอง #{booking.id}
                        </span>
                        {getStatusBadge(booking.status)}
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${verificationClasses}`}>
                          {getVerificationBadge(payment?.verificationStatus)}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                        <div className="min-w-0">
                          <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">ลูกค้า</p>
                          <h2 className="mt-2 text-lg font-semibold text-gray-900">{getBookingContactName(booking)}</h2>
                          <p className="mt-1 text-sm text-gray-500">{getBookingContactEmail(booking)}</p>
                          <p className="text-sm text-gray-500">{getBookingContactPhone(booking)}</p>
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">ทัวร์ที่จอง</p>
                          <h3 className="mt-2 text-base font-semibold text-gray-900">
                            {booking.schedule?.tour?.name || 'ไม่พบข้อมูลทัวร์'}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            {booking.schedule?.tour?.tourCode || '-'} • {booking.paxCount} ท่าน
                          </p>
                        </div>
                      </div>

                    </div>

                    <aside className="flex flex-col justify-between border-t border-gray-100 bg-gray-50/70 p-5 lg:border-l lg:border-t-0">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">การดำเนินการ</p>
                        <div className="mt-3 flex flex-col gap-2">
                          {hasSlip ? (
                            <button
                              type="button"
                              onClick={() => setSelectedBooking(booking)}
                              className="ui-focus-ring ui-pressable rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                            >
                              ดูสลิปและรายละเอียด
                            </button>
                          ) : (
                            <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-3 text-sm text-gray-400">
                              รายการนี้ยังไม่มีสลิป
                            </div>
                          )}
                        </div>
                      </div>

                    </aside>
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </main>

      <Modal isOpen={selectedBooking !== null} onClose={() => setSelectedBooking(null)} width="max-w-[62rem]">
        {selectedBooking && (() => {
          const payment = getPrimaryPayment(selectedBooking)
          const tone = getVerificationTone(payment?.verificationStatus)
          const classes = getVerificationClasses(tone)
          const verifiedAmount = payment?.verifiedAmount !== null && payment?.verifiedAmount !== undefined
            ? Number(payment.verifiedAmount)
            : null
          const verificationSections = buildVerificationDetails(payment?.verificationRaw)

          return (
            <div>
              <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">ตรวจสอบสลิปโอนเงิน</h2>
                  <p className="mt-1 text-lg text-gray-500">รายการจอง #{selectedBooking.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="ui-focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_26rem]">
                <section>
                  {selectedSlipUrl ? (
                    <>
                      <div className="flex items-start justify-center rounded-[1.5rem] border border-gray-100 bg-gray-50 p-4">
                        <img
                          src={selectedSlipUrl}
                          alt="Payment Slip"
                          className="max-h-[31rem] w-full max-w-[24rem] object-contain"
                        />
                      </div>

                      <div className="mt-4 flex gap-3">
                        {selectedBooking.status === 'awaiting_approval' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus('canceled')}
                              disabled={isProcessing}
                              className="ui-focus-ring ui-pressable flex-1 rounded-xl bg-red-100 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-200 disabled:opacity-50"
                            >
                              ไม่อนุมัติ
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus('confirmed')}
                              disabled={isProcessing}
                              className="ui-focus-ring ui-pressable flex-1 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50"
                            >
                              อนุมัติ
                            </button>
                          </>
                        )}

                        {['confirmed', 'success', 'canceled'].includes(selectedBooking.status) && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus('awaiting_approval')}
                            disabled={isProcessing}
                            className="ui-focus-ring ui-pressable w-full rounded-xl bg-yellow-100 px-4 py-2.5 text-sm font-semibold text-yellow-700 hover:bg-yellow-200 disabled:opacity-50"
                          >
                            เปลี่ยนกลับเป็นรอตรวจสอบ
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex min-h-[18rem] items-center justify-center rounded-[1.5rem] border border-gray-100 bg-gray-50 text-base text-gray-500">
                      ไม่พบรูปภาพสลิป
                    </div>
                  )}
                </section>

                <aside>
                  <div className="flex h-full flex-col rounded-[1.5rem] border border-gray-100 bg-white p-4">
                    <div className="rounded-[1.25rem] bg-gray-50 p-4">
                      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_11rem]">
                        <div className="min-w-0">
                          <p className="text-sm text-gray-500">ลูกค้า</p>
                          <p className="mt-1 text-[1.02rem] font-bold text-gray-900">{getBookingContactName(selectedBooking)}</p>
                        </div>
                        <div className="xl:text-right">
                          <p className="text-sm text-gray-500">ยอดที่ต้องชำระ</p>
                          <p className="mt-1 text-[1.15rem] font-bold leading-none text-gray-900">{Number(selectedBooking.totalPrice).toLocaleString()} บาท</p>
                        </div>
                      </div>

                      <div className="mt-3 flex min-w-0 items-center gap-2 text-sm text-gray-700">
                        <span className="truncate">{getBookingContactEmail(selectedBooking)}</span>
                        <span className="shrink-0 text-gray-300">|</span>
                        <span className="shrink-0">{getBookingContactPhone(selectedBooking)}</span>
                      </div>
                      <p className="mt-1 text-sm font-semibold leading-6 text-gray-800">
                        <span className="mr-2 font-medium text-gray-500">อัปโหลดเมื่อ</span>
                        {formatCompactDateTime(payment?.uploadedAt)}
                      </p>

                      <div className="mt-4 grid gap-x-4 gap-y-2 border-t border-gray-200 pt-4 text-sm text-gray-700 sm:grid-cols-2">
                        <p className="sm:col-span-2"><span className="font-semibold text-gray-900">ทัวร์:</span> {selectedBooking.schedule?.tour?.name || '-'}</p>
                        <p><span className="font-semibold text-gray-900">รหัสทัวร์:</span> {selectedBooking.schedule?.tour?.tourCode || '-'}</p>
                        <p><span className="font-semibold text-gray-900">จำนวนผู้เดินทาง:</span> {selectedBooking.paxCount} ท่าน</p>
                      </div>
                    </div>

                    <div className={`mt-4 rounded-[1.5rem] border p-4 ${classes}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-bold">ผลตรวจสลิปจากระบบ</p>
                          <div className="mt-2 inline-flex rounded-full border px-3 py-1 text-sm font-bold">
                            {getVerificationBadge(payment?.verificationStatus)}
                          </div>
                        </div>
                        <div className="text-right text-sm font-semibold">
                          {payment?.verificationProvider || '-'}
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-6">
                        {payment?.verificationMessage || 'ยังไม่มีผลตรวจสลิปอัตโนมัติสำหรับรายการนี้'}
                      </p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-white/80 px-4 py-3">
                          <p className="text-sm text-gray-500">ยอดในระบบ</p>
                          <p className="mt-1 text-lg font-bold text-gray-900">฿{Number(selectedBooking.totalPrice).toLocaleString()}</p>
                        </div>
                        <div className="rounded-xl bg-white/80 px-4 py-3">
                          <p className="text-sm text-gray-500">ยอดจากระบบ</p>
                          <p className="mt-1 text-lg font-bold text-gray-900">
                            {verifiedAmount !== null ? `฿${verifiedAmount.toLocaleString()}` : '-'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 rounded-xl bg-white/70 px-4 py-3 text-sm text-gray-800 sm:grid-cols-2">
                        <p><span className="font-semibold">เวลาตรวจ:</span> {payment?.verifiedAt ? new Date(payment.verifiedAt).toLocaleString('th-TH') : '-'}</p>
                        <p><span className="font-semibold">Ref:</span> {payment?.verifiedTransRef || '-'}</p>
                      </div>

                      {payment?.verificationRaw && (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => setShowVerificationRaw((prev) => !prev)}
                            className="ui-focus-ring w-full rounded-xl border border-current/20 bg-white/70 px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-white"
                          >
                            {showVerificationRaw ? 'ซ่อนรายละเอียดผลตรวจจาก API' : 'ดูรายละเอียดผลตรวจจาก API'}
                          </button>

                          {showVerificationRaw && (
                            verificationSections.length > 0 ? (
                              <div className="mt-3 space-y-3">
                                {verificationSections.map((section) => (
                                  <section key={section.title} className="rounded-2xl bg-white/80 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                                      {section.title}
                                    </p>
                                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                      {section.items.map((detail) => (
                                        <div key={`${section.title}-${detail.label}`} className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-800">
                                          <p className="text-xs font-medium text-gray-400">{detail.label}</p>
                                          <p className="mt-1 break-words text-sm font-semibold leading-6 text-gray-900">{detail.value}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </section>
                                ))}
                              </div>
                            ) : (
                              <div className="mt-3 rounded-xl bg-white/80 px-4 py-3 text-sm text-gray-600">
                                ไม่มีรายละเอียดเพิ่มเติมจาก API สำหรับรายการนี้
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>

                    {selectedBooking.specialRequest && (
                      <div className="mt-4 rounded-[1.25rem] border border-orange-100 bg-orange-50 p-4">
                        <p className="mb-2 text-base font-bold text-orange-800">คำขอเพิ่มเติมจากลูกค้า</p>
                        <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">{selectedBooking.specialRequest}</p>
                      </div>
                    )}
                  </div>
                </aside>
              </div>
            </div>
          )
        })()}
      </Modal>
    </>
  )
}
