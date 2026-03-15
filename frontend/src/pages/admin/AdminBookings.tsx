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
  { label: 'พนักงานยืนยันแล้ว', value: 'confirmed' },
  { label: 'ยกเลิกแล้ว', value: 'canceled' },
] as const

type FilterValue = (typeof FILTER_TABS)[number]['value']
type VerificationTone = 'green' | 'yellow' | 'red' | 'gray'

type RawRecord = Record<string, unknown>

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

function getPrimaryPayment(booking: Booking) {
  return booking.payments?.[0]
}

function getRawRecord(value: unknown): RawRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as RawRecord
}

function getRawString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function getRawNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function getEffectiveVerificationStatus(booking: Booking) {
  const payment = getPrimaryPayment(booking)
  const verifiedAmount = payment?.verifiedAmount !== null && payment?.verifiedAmount !== undefined
    ? Number(payment.verifiedAmount)
    : null

  if (
    payment?.verificationStatus === 'failed'
    && verifiedAmount !== null
    && Math.abs(verifiedAmount - Number(booking.totalPrice)) > 0.01
  ) {
    return 'amount_mismatch'
  }

  return payment?.verificationStatus
}

function getEffectiveVerificationMessage(booking: Booking) {
  const payment = getPrimaryPayment(booking)
  const effectiveStatus = getEffectiveVerificationStatus(booking)
  const verifiedAmount = payment?.verifiedAmount !== null && payment?.verifiedAmount !== undefined
    ? Number(payment.verifiedAmount)
    : null

  if (effectiveStatus === 'amount_mismatch' && verifiedAmount !== null) {
    return `ยอดจากสลิป ฿${verifiedAmount.toLocaleString()} ไม่ตรงกับยอดที่ต้องชำระ ฿${Number(booking.totalPrice).toLocaleString()}`
  }

  return payment?.verificationMessage
}

function getVerificationDetails(raw?: Record<string, unknown> | null) {
  const root = getRawRecord(raw)
  const data = getRawRecord(root?.data)
  const receiver = getRawRecord(data?.receiver)
  const receiverAccount = getRawRecord(receiver?.account)
  const receiverBankInfo = getRawRecord(receiverAccount?.bank)
  const receiverProxy = getRawRecord(receiverAccount?.proxy)
  const receiverBank = getRawRecord(receiver?.bank)
  const sender = getRawRecord(data?.sender)
  const senderAccount = getRawRecord(sender?.account)
  const senderAccountBank = getRawRecord(senderAccount?.bank)
  const senderBank = getRawRecord(sender?.bank)

  return {
    code: getRawString(root?.code),
    message: getRawString(root?.message),
    referenceId: getRawString(data?.referenceId),
    decode: getRawString(data?.decode),
    transRef: getRawString(data?.transRef),
    dateTime: getRawString(data?.dateTime),
    amount: getRawNumber(data?.amount),
    ref1: getRawString(data?.ref1),
    ref2: getRawString(data?.ref2),
    ref3: getRawString(data?.ref3),
    receiverName: getRawString(receiverAccount?.name),
    receiverAccountNumber: getRawString(receiverBankInfo?.account),
    receiverProxyType: getRawString(receiverProxy?.type),
    receiverProxyAccount: getRawString(receiverProxy?.account),
    receiverBankId: getRawString(receiverBank?.id),
    receiverBankName: getRawString(receiverBank?.name),
    senderName: getRawString(senderAccount?.name),
    senderAccountNumber: getRawString(senderAccountBank?.account),
    senderBankId: getRawString(senderBank?.id),
    senderBankName: getRawString(senderBank?.name),
  }
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.04em] text-gray-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-gray-900">{value || '-'}</p>
    </div>
  )
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
      return 'border-blue-200 bg-blue-50 text-blue-700'
    case 'red':
      return 'border-red-200 bg-red-50 text-red-700'
    default:
      return 'border-gray-200 bg-gray-50 text-gray-700'
  }
}

function getVerificationProviderLabel(provider?: string | null) {
  if (!provider) return '-'
  return 'ระบบ'
}

function getVerificationMessage(message?: string | null) {
  if (!message) {
    return 'ยังไม่มีผลตรวจสลิปอัตโนมัติสำหรับรายการนี้'
  }

  return message.replace(/EasySlip/gi, 'ระบบ').replace(/Slip2Go/gi, 'ระบบ')
}

function getSummaryVerificationMessage(booking: Booking) {
  const payment = getPrimaryPayment(booking)
  const effectiveStatus = getEffectiveVerificationStatus(booking)
  const verifiedAmount = payment?.verifiedAmount !== null && payment?.verifiedAmount !== undefined
    ? Number(payment.verifiedAmount)
    : null

  if (effectiveStatus === 'amount_mismatch' && verifiedAmount !== null) {
    return `ยอดจากสลิป ฿${verifiedAmount.toLocaleString()} ไม่ตรงกับยอดที่ต้องชำระ`
  }

  if (effectiveStatus === 'verified') {
    return 'ข้อมูลสลิปผ่านการตรวจสอบจากระบบ'
  }

  if (effectiveStatus === 'duplicate') {
    return 'ระบบพบว่าสลิปนี้อาจถูกใช้งานซ้ำ'
  }

  if (effectiveStatus === 'unreadable') {
    return 'ระบบอ่านข้อมูลจากสลิปใบนี้ไม่ได้'
  }

  if (effectiveStatus === 'unavailable') {
    return 'ระบบตรวจสลิปไม่พร้อมใช้งานชั่วคราว'
  }

  return getVerificationMessage(getEffectiveVerificationMessage(booking))
}

function formatCompactDateTime(value?: string | null) {
  if (!value) return '-'

  return new Date(value).toLocaleString('th-TH', {
    day: 'numeric',
    month: 'numeric',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatFullDateTime(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleString('th-TH')
}

function maskUserAgent(userAgent?: string | null) {
  if (!userAgent) return '-'
  return userAgent.length > 80 ? `${userAgent.slice(0, 80)}...` : userAgent
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterValue>('awaiting_approval')
  const [search, setSearch] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showAdvancedDetails, setShowAdvancedDetails] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedSlipPreviewUrl, setSelectedSlipPreviewUrl] = useState<string | null>(null)

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
    setShowAdvancedDetails(false)
  }, [selectedBooking])

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    const paymentId = selectedBooking ? getPrimaryPayment(selectedBooking)?.id : null
    if (!paymentId) {
      setSelectedSlipPreviewUrl(null)
      return () => {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl)
        }
      }
    }

    const loadProtectedSlip = async () => {
      try {
        const blob = await bookingService.getProtectedSlipBlob(paymentId)
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setSelectedSlipPreviewUrl(objectUrl)
      } catch (error) {
        console.error(error)
        if (!cancelled) {
          setSelectedSlipPreviewUrl(null)
          toast.error('ไม่สามารถโหลดรูปสลิปได้')
        }
      }
    }

    void loadProtectedSlip()

    return () => {
      cancelled = true
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
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
      if (filter === 'canceled' && booking.status !== 'canceled') return false

      if (search.trim()) {
        const term = search.trim().toLowerCase()
        const contactName = getBookingContactName(booking).toLowerCase()
        const contactEmail = getBookingContactEmail(booking).toLowerCase()
        const contactPhone = getBookingContactPhone(booking).toLowerCase()
        const tourCode = booking.schedule?.tour?.tourCode?.toLowerCase() || ''
        const payment = getPrimaryPayment(booking)
        const uploadedFromIp = payment?.uploadedFromIp?.toLowerCase() || ''
        const uploadedByUserId = payment?.uploadedByUserId?.toLowerCase() || ''
        const reviewedByUserId = booking.reviewedByUserId?.toLowerCase() || ''
        const paymentId = payment?.id?.toString() || ''
        return contactName.includes(term)
          || contactEmail.includes(term)
          || contactPhone.includes(term)
          || tourCode.includes(term)
          || booking.id.toString() === term
          || paymentId === term
          || uploadedFromIp.includes(term)
          || uploadedByUserId.includes(term)
          || reviewedByUserId.includes(term)
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
                    const payment = getPrimaryPayment(booking)
                    const hasSlip = Boolean(payment?.slipUrl)
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

      <Modal isOpen={selectedBooking !== null} onClose={() => setSelectedBooking(null)} width="max-w-[57rem]">
        {selectedBooking && (() => {
          const payment = getPrimaryPayment(selectedBooking)
          const effectiveStatus = getEffectiveVerificationStatus(selectedBooking)
          const tone = getVerificationTone(effectiveStatus)
          const classes = getVerificationClasses(tone)
          const verifiedAmount = payment?.verifiedAmount !== null && payment?.verifiedAmount !== undefined
            ? Number(payment.verifiedAmount)
            : null
          const slipImageUrl = selectedSlipPreviewUrl
          const verificationDetails = getVerificationDetails(payment?.verificationRaw)
          const transferAtLabel = verificationDetails.dateTime ? formatCompactDateTime(verificationDetails.dateTime) : '-'
          const uploadedAtLabel = payment?.uploadedAt ? formatCompactDateTime(payment.uploadedAt) : '-'

          return (
            <div>
              <div className="mb-5 flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">ตรวจสอบสลิปโอนเงิน (จอง #{selectedBooking.id})</h2>
                </div>
                <button type="button" onClick={() => setSelectedBooking(null)} className="ui-focus-ring flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700">✕</button>
              </div>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_26rem]">
                <section className="xl:sticky xl:top-0 xl:self-start">
                  {slipImageUrl ? (
                    <>
                      <div className="w-[22rem] overflow-hidden rounded-[1.25rem] border border-gray-100 bg-slate-50">
                        <div className="h-[31rem] overflow-hidden">
                          <img
                            src={slipImageUrl}
                            alt="Payment Slip"
                            className="h-full w-full object-cover object-top"
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex max-w-[22rem] gap-3">
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
                            เปลี่ยนสถานะกลับเป็น รอตรวจสอบ
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex min-h-[18rem] items-center justify-start text-base text-gray-500">
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
                          <p className="mt-1 text-lg font-bold text-gray-900">{getBookingContactName(selectedBooking)}</p>
                        </div>
                        <div className="xl:text-right">
                          <p className="text-sm text-gray-500">ยอดที่ต้องชำระ</p>
                          <p className="mt-1 text-[1.25rem] font-bold leading-none text-gray-900">฿{Number(selectedBooking.totalPrice).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex min-w-0 items-center gap-2 text-sm text-gray-700">
                        <span className="truncate">{getBookingContactEmail(selectedBooking)}</span>
                        <span className="shrink-0 text-gray-300">|</span>
                        <span className="shrink-0">{getBookingContactPhone(selectedBooking)}</span>
                      </div>
                      <p className="mt-1 text-left text-sm font-semibold leading-6 text-gray-800">
                        <span className="mr-2 font-medium text-gray-500">อัปโหลดเมื่อ</span>
                        {formatCompactDateTime(payment?.uploadedAt)}
                      </p>

                      <div className="mt-4 grid gap-x-4 gap-y-2 border-t border-gray-200 pt-4 text-base text-gray-700 sm:grid-cols-2">
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
                            {getVerificationBadge(effectiveStatus)}
                          </div>
                        </div>
                        <div className="text-right text-sm font-semibold">
                          {getVerificationProviderLabel(payment?.verificationProvider)}
                        </div>
                      </div>
                      <p className="mt-3 text-sm font-semibold leading-6">
                        {getSummaryVerificationMessage(selectedBooking)}
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

                      <div className="mt-3 rounded-xl bg-white/70 px-4 py-3 text-sm text-gray-800">
                        <div className="space-y-1">
                          <p><span className="font-semibold">เวลาโอน:</span> {transferAtLabel}</p>
                          <p><span className="font-semibold">อัปโหลดเมื่อ:</span> {uploadedAtLabel}</p>
                        </div>
                        <p className="mt-3"><span className="font-semibold">Ref:</span> {payment?.verifiedTransRef || '-'}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowAdvancedDetails((prev) => !prev)}
                        className="mt-3 ui-focus-ring w-full rounded-xl border border-white/70 bg-white/70 px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-white"
                      >
                        {showAdvancedDetails ? 'ซ่อนข้อมูลละเอียด' : 'ดูข้อมูลละเอียด'}
                      </button>
                    </div>

                    {showAdvancedDetails && (
                      <div className="mt-4 grid gap-4">
                        <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                          <p className="text-base font-bold text-slate-900">ธุรกรรม</p>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <DetailRow label="Result Code" value={verificationDetails.code} />
                            <DetailRow label="Reference ID" value={verificationDetails.referenceId} />
                            <DetailRow label="Bank Ref" value={verificationDetails.transRef ?? payment?.verifiedTransRef ?? null} />
                            <DetailRow label="Decoded QR" value={verificationDetails.decode} />
                            <DetailRow
                              label="เวลาตรวจ"
                              value={payment?.verifiedAt ? formatFullDateTime(payment.verifiedAt) : null}
                            />
                            <DetailRow
                              label="เวลาโอน"
                              value={verificationDetails.dateTime ? formatFullDateTime(verificationDetails.dateTime) : null}
                            />
                            <DetailRow
                              label="Amount From Slip"
                              value={verificationDetails.amount !== null ? `฿${verificationDetails.amount.toLocaleString()}` : null}
                            />
                            <DetailRow label="Ref1" value={verificationDetails.ref1} />
                            <DetailRow label="Ref2" value={verificationDetails.ref2} />
                            <DetailRow label="Ref3" value={verificationDetails.ref3} />
                            <div className="sm:col-span-2">
                              <DetailRow label="Provider Message" value={verificationDetails.message} />
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 p-4">
                          <p className="text-base font-bold text-emerald-900">ผู้รับเงิน</p>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <DetailRow label="ชื่อผู้รับ" value={verificationDetails.receiverName} />
                            <DetailRow label="เลขบัญชี" value={verificationDetails.receiverAccountNumber} />
                            <DetailRow label="ธนาคาร" value={verificationDetails.receiverBankName} />
                            <DetailRow label="รหัสธนาคาร" value={verificationDetails.receiverBankId} />
                            <DetailRow label="Proxy Type" value={verificationDetails.receiverProxyType} />
                            <DetailRow label="Proxy Account" value={verificationDetails.receiverProxyAccount} />
                          </div>
                        </div>

                        <div className="rounded-[1.25rem] border border-cyan-200 bg-cyan-50 p-4">
                          <p className="text-base font-bold text-cyan-900">ผู้โอนเงิน</p>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <DetailRow label="ชื่อผู้โอน" value={verificationDetails.senderName} />
                            <DetailRow label="เลขบัญชี" value={verificationDetails.senderAccountNumber} />
                            <DetailRow label="ธนาคาร" value={verificationDetails.senderBankName} />
                            <DetailRow label="รหัสธนาคาร" value={verificationDetails.senderBankId} />
                          </div>
                        </div>

                        <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                          <p className="text-base font-bold text-slate-900">Audit</p>
                          <div className="mt-3 grid gap-x-4 gap-y-2 text-sm text-slate-700 sm:grid-cols-2">
                            <p><span className="font-semibold text-slate-900">Payment ID:</span> {payment?.id ?? '-'}</p>
                            <p><span className="font-semibold text-slate-900">Uploader:</span> {payment?.uploadedByUserId || '-'}</p>
                            <p><span className="font-semibold text-slate-900">Upload IP:</span> {payment?.uploadedFromIp || '-'}</p>
                            <p><span className="font-semibold text-slate-900">Reviewer:</span> {selectedBooking.reviewedByUserId || '-'}</p>
                            <p><span className="font-semibold text-slate-900">Reviewed:</span> {selectedBooking.reviewedAt ? formatCompactDateTime(selectedBooking.reviewedAt) : '-'}</p>
                            <p className="sm:col-span-2"><span className="font-semibold text-slate-900">User Agent:</span> {maskUserAgent(payment?.uploadedFromUserAgent)}</p>
                          </div>
                        </div>

                        {selectedBooking.specialRequest && (
                          <div className="rounded-[1.25rem] border border-orange-100 bg-orange-50 p-4">
                            <p className="mb-2 text-base font-bold text-orange-800">คำขอเพิ่มเติมจากลูกค้า</p>
                            <p className="max-h-20 overflow-hidden whitespace-pre-wrap text-base leading-6 text-gray-700">{selectedBooking.specialRequest}</p>
                          </div>
                        )}
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

