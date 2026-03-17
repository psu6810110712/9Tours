import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import Modal from '../components/common/Modal'
import ReviewModal from '../components/reviews/ReviewModal'
import { bookingService } from '../services/bookingService'
import { buildDisplayName } from '../utils/profileValidation'

interface MyBookingItem {
  id: number
  tourId: number | null
  tourCode: string
  tourName: string
  date: string
  startDate: string
  endDate: string
  price: number
  adultPrice: number
  childPrice: number
  status: string
  adults: number
  children: number
  image: string
  accommodation: string
  createdAt: string
  paidAt: string
  contactPrefix?: string | null
  contactName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  specialRequest?: string
  roundName?: string | null
  timeSlot?: string | null
  duration?: string | null
  transportation?: string | null
  highlights: string[]
  itinerary: { day?: number; time: string; title: string; description: string }[]
  isRefundRequested: boolean
  cancellationReason: string
  travelersInfo: { name: string; isLeadTraveler?: boolean }[]
  hasReview: boolean
  rawStatus: string
}

const tabs = ['ทั้งหมด', 'รอชำระเงิน', 'รอตรวจสอบ', 'สำเร็จ', 'รอคืนเงิน', 'ยกเลิกแล้ว']
const CANCELLABLE_STATUSES = ['รอชำระเงิน', 'รอตรวจสอบ', 'สำเร็จ']
const PRICE_BREAKDOWN_HIDDEN_STATUSES = ['รอตรวจสอบ', 'สำเร็จ']

export default function MyBookingPage() {
  const [activeTab, setActiveTab] = useState('ทั้งหมด')
  const [bookings, setBookings] = useState<MyBookingItem[]>([])
  const [selectedBooking, setSelectedBooking] = useState<MyBookingItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelModalId, setCancelModalId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [reviewBooking, setReviewBooking] = useState<MyBookingItem | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    void loadBookings()
  }, [])

  const mapStatusToThai = (status: string) => {
    switch (status) {
      case 'pending_payment': return 'รอชำระเงิน'
      case 'awaiting_approval': return 'รอตรวจสอบ'
      case 'success':
      case 'confirmed': return 'สำเร็จ'
      case 'canceled': return 'ยกเลิกแล้ว'
      case 'refund_pending': return 'รอคืนเงิน'
      case 'refund_completed': return 'คืนเงินสำเร็จ'
      default: return status
    }
  }

  const loadBookings = async () => {
    try {
      setLoading(true)
      const data = await bookingService.getMyBookings()

      const formattedBookings = data.map((booking) => {
        let finalPaidAt = ''
        if (booking.payments?.[0]?.uploadedAt) {
          const rawStr = booking.payments[0].uploadedAt
          const strWithZ = rawStr.endsWith('Z') || rawStr.includes('+') ? rawStr : `${rawStr.replace(' ', 'T')}Z`

          let paidDate = new Date(strWithZ)
          if (booking.createdAt) {
            const createdDate = new Date(booking.createdAt)
            if (paidDate.getTime() < createdDate.getTime()) {
              paidDate = new Date(paidDate.getTime() + 7 * 60 * 60 * 1000)
            }
          }
          finalPaidAt = paidDate.toISOString()
        }

        return {
          id: booking.id,
          tourId: booking.schedule?.tour?.id ?? null,
          tourCode: booking.schedule?.tour?.tourCode || `T-${booking.scheduleId}`,
          tourName: booking.schedule?.tour?.name || 'รายการจอง',
          date: `รอบเดินทางอ้างอิง: ${booking.scheduleId}`,
          startDate: booking.schedule?.startDate || '',
          endDate: booking.schedule?.endDate || '',
          price: booking.totalPrice,
          adultPrice: booking.schedule?.tour?.price || 0,
          childPrice: booking.schedule?.tour?.childPrice || 0,
          status: mapStatusToThai(booking.status),
          adults: booking.adults || booking.paxCount || 1,
          children: booking.children || 0,
          image: typeof booking.schedule?.tour?.images?.[0] === 'string'
            ? booking.schedule.tour.images[0]
            : 'https://images.unsplash.com/photo-1528181304800-2f140819898f?auto=format&fit=crop&w=300',
          accommodation: booking.schedule?.tour?.accommodation || '',
          createdAt: booking.createdAt || '',
          paidAt: finalPaidAt,
          contactPrefix: booking.contactPrefix ?? null,
          contactName: booking.contactName ?? null,
          contactEmail: booking.contactEmail ?? null,
          contactPhone: booking.contactPhone ?? null,
          specialRequest: booking.specialRequest || '',
          roundName: booking.schedule?.roundName || null,
          timeSlot: booking.schedule?.timeSlot || null,
          duration: booking.schedule?.tour?.duration || null,
          transportation: booking.schedule?.tour?.transportation || null,
          highlights: booking.schedule?.tour?.highlights || [],
          itinerary: booking.schedule?.tour?.itinerary || [],
          isRefundRequested: booking.isRefundRequested ?? false,
          cancellationReason: booking.cancellationReason ?? '',
          travelersInfo: booking.travelersInfo ?? [],
          hasReview: booking.hasReview ?? false,
          rawStatus: booking.status,
        }
      })

      setBookings(formattedBookings)
    } catch (error) {
      console.error('Error loading my bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await bookingService.cancelBooking(bookingId, cancelReason.trim() || undefined)
      toast.success('ยกเลิกการจองสำเร็จ')
      setCancelModalId(null)
      setCancelReason('')
      await loadBookings()
    } catch (error: unknown) {
      const resolvedError = error as { response?: { data?: { message?: string } } }
      console.error('Error canceling booking:', error)
      toast.error(resolvedError.response?.data?.message || 'เกิดข้อผิดพลาดในการยกเลิก กรุณาลองใหม่อีกครั้ง')
      setCancelModalId(null)
      setCancelReason('')
    }
  }

  const filteredBookings = useMemo(() => {
    if (activeTab === 'ทั้งหมด') return bookings
    if (activeTab === 'รอคืนเงิน') return bookings.filter((booking) => booking.isRefundRequested)
    return bookings.filter((booking) => booking.status === activeTab)
  }, [activeTab, bookings])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'รอชำระเงิน': return 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20'
      case 'รอตรวจสอบ': return 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20'
      case 'สำเร็จ': return 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
      case 'ยกเลิกแล้ว': return 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10'
      case 'รอคืนเงิน': return 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20'
      case 'คืนเงินสำเร็จ': return 'bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-600/20'
      default: return 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10'
    }
  }

  const getModalHeaderColor = (status: string) => {
    switch (status) {
      case 'รอชำระเงิน': return 'bg-[#FFC107]'
      case 'รอตรวจสอบ': return 'bg-[#F97316]'
      case 'สำเร็จ': return 'bg-[#10B981]'
      case 'ยกเลิกแล้ว': return 'bg-[#EF4444]'
      case 'รอคืนเงิน': return 'bg-[#8B5CF6]'
      case 'คืนเงินสำเร็จ': return 'bg-[#14B8A6]'
      default: return 'bg-gray-500'
    }
  }

  const getModalHeaderText = (status: string) => {
    switch (status) {
      case 'รอชำระเงิน': return 'อยู่ระหว่างการรอชำระเงิน'
      case 'รอตรวจสอบ': return 'รอการตรวจสอบ'
      case 'สำเร็จ': return 'ชำระเงินแล้ว'
      case 'ยกเลิกแล้ว': return 'ยกเลิกแล้ว'
      case 'รอคืนเงิน': return 'รอดำเนินการคืนเงิน'
      case 'คืนเงินสำเร็จ': return 'คืนเงินเรียบร้อยแล้ว'
      default: return 'สถานะไม่ทราบ'
    }
  }

  const formatTravelDate = (booking: MyBookingItem) => (
    booking.startDate && booking.endDate
      ? `${new Date(booking.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })} - ${new Date(booking.endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}`
      : booking.date
  )

  const formatDateTime = (value?: string) => {
    if (!value) return '-'
    return new Date(value).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
  }

  const selectedCanPay = selectedBooking?.status === 'รอชำระเงิน'
  const selectedCanCancel = selectedBooking ? CANCELLABLE_STATUSES.includes(selectedBooking.status) : false
  const selectedHidePriceBreakdown = selectedBooking ? PRICE_BREAKDOWN_HIDDEN_STATUSES.includes(selectedBooking.status) : false
  const selectedContactName = selectedBooking ? buildDisplayName(selectedBooking.contactPrefix, selectedBooking.contactName) || selectedBooking.contactName || '-' : '-'
  const selectedRoundLabel = selectedBooking?.roundName || selectedBooking?.timeSlot || '-'
  const selectedTourNotes = selectedBooking?.highlights?.slice(0, 3) || []
  const selectedItineraryPreview = selectedBooking?.itinerary?.slice(0, 2) || []
  const showBookingExtraDetails = Boolean(
    selectedBooking
    && (
      selectedHidePriceBreakdown
      || selectedBooking.contactEmail
      || selectedBooking.contactPhone
      || selectedBooking.specialRequest
      || selectedBooking.duration
      || selectedBooking.transportation
      || selectedTourNotes.length > 0
      || selectedItineraryPreview.length > 0
      || selectedBooking.roundName
      || selectedBooking.timeSlot
    )
  )

  return (
    <div className="bg-[#F8FAFC]">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">การจองของฉัน</h1>
          <p className="mt-2 text-sm text-gray-500">ตรวจสอบสถานะ ชำระเงิน และดูรายละเอียดรายการจองของคุณได้ที่นี่</p>
        </div>

        <div className="scrollbar-hide mb-8 flex gap-3 overflow-x-auto border-b border-gray-200 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-primary text-white shadow-sm' : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="ui-surface rounded-[1.5rem] border border-gray-100 bg-white px-6 py-16 text-center text-gray-400">
              <p className="font-bold">กำลังโหลด...</p>
            </div>
          ) : filteredBookings.length > 0 ? filteredBookings.map((booking) => {
            const canPay = booking.status === 'รอชำระเงิน'
            const canCancel = CANCELLABLE_STATUSES.includes(booking.status)
            const showPrimaryAmount = canPay
            const showCompactAmount = !canPay && booking.price > 0

            return (
              <article
                key={booking.id}
                className={`ui-surface rounded-[1.5rem] border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg md:p-5 ${booking.status === 'ยกเลิกแล้ว' ? 'opacity-75' : ''}`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-stretch md:gap-6">
                  <div className="order-1 overflow-hidden rounded-2xl md:order-1 md:max-w-[230px] md:shrink-0 md:self-stretch">
                    <div className="h-32 w-full overflow-hidden rounded-[1.5rem] md:h-full md:rounded-[1.25rem]">
                      <img
                        src={booking.image}
                        alt={booking.tourName}
                        className={`h-full w-full object-cover ${booking.status === 'ยกเลิกแล้ว' ? 'grayscale' : ''}`}
                      />
                    </div>
                  </div>

                  <div className="order-2 min-w-0 flex-1 md:order-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold tracking-wide ${getStatusBadge(booking.status)}`}>
                        <svg className="h-1.5 w-1.5 fill-current" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" /></svg>
                        {booking.status}
                      </span>
                      {booking.isRefundRequested && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 ring-1 ring-inset ring-purple-600/20">
                          รอคืนเงิน
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <h3 className={`text-xl font-bold leading-snug sm:text-2xl ${booking.status === 'ยกเลิกแล้ว' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {booking.tourName}
                        </h3>
                        <p className="mt-1 text-base font-semibold text-gray-500">
                          รหัสทัวร์ <span className="font-mono font-semibold text-gray-700">{booking.tourCode}</span>
                        </p>
                      </div>

                      {showPrimaryAmount && (
                        <div className="rounded-2xl bg-gray-50 px-4 py-3 text-left sm:min-w-[160px] sm:text-right">
                          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">ยอดชำระ</p>
                          <div className="mt-1 flex items-baseline gap-2 sm:justify-end">
                            <span className="text-3xl font-black text-gray-900">{Math.round(booking.price).toLocaleString()}</span>
                            <span className="text-base font-semibold text-gray-700">บาท</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {!showPrimaryAmount && showCompactAmount && (
                      <div className="mt-2 rounded-full bg-gray-50 px-4 py-1.5 text-xs font-semibold text-gray-600 inline-flex items-center gap-2">
                        ยอดชำระ <span className="text-gray-900">{Math.round(booking.price).toLocaleString()} บาท</span>
                      </div>
                    )}

                    <div className="mt-4 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                      <div className="flex items-center gap-2 rounded-2xl bg-gray-50 px-4 py-3">
                        <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                        <span>{formatTravelDate(booking)}</span>
                      </div>
                      <div className="flex items-center gap-2 rounded-2xl bg-gray-50 px-4 py-3">
                        <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        <span>ผู้ใหญ่ {booking.adults}, เด็ก {booking.children}</span>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      {canCancel ? (
                        <p className="text-xs text-gray-400">สามารถยกเลิกได้ก่อนวันเดินทางอย่างน้อย 7 วัน</p>
                      ) : (
                        <span />
                      )}

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => setSelectedBooking(booking)}
                          className="ui-focus-ring ui-pressable rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
                        >
                          รายละเอียด
                        </button>

                        {canPay && (
                          <button
                            type="button"
                            onClick={() => navigate(`/payment/${booking.id}`)}
                            className="ui-focus-ring ui-pressable rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
                          >
                            ชำระเงิน
                          </button>
                        )}

                        {(booking.rawStatus === 'success' || booking.rawStatus === 'confirmed') && (
                          booking.hasReview ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700">
                              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                              รีวิวแล้ว
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setReviewBooking(booking)}
                              className="ui-focus-ring ui-pressable rounded-full border border-green-200 bg-white px-5 py-2.5 text-sm font-bold text-green-600 hover:bg-green-50"
                            >
                              เขียนรีวิว
                            </button>
                          )
                        )}

                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => setCancelModalId(String(booking.id))}
                            className="ui-focus-ring ui-pressable rounded-full border border-red-200 bg-white px-5 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50"
                          >
                            ยกเลิกการจอง
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            )
          }) : (
            <div className="ui-surface rounded-[1.5rem] border border-dashed border-gray-200 bg-white px-6 py-16 text-center text-gray-400">
              <span className="mb-3 block text-4xl">📄</span>
              <p className="font-bold">ไม่พบรายการ</p>
            </div>
          )}
        </div>
      </main>

      <Modal isOpen={selectedBooking !== null} onClose={() => setSelectedBooking(null)} width="max-w-4xl">
        {selectedBooking && (
          <div className="relative space-y-5 pt-1">
            <button
              type="button"
              onClick={() => setSelectedBooking(null)}
              className="ui-focus-ring absolute right-0 top-0 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-700"
              aria-label="ปิดหน้าต่างรายละเอียดการจอง"
              title="ปิด"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            <div className={`rounded-[1.25rem] px-5 py-4 pr-14 text-white sm:px-6 sm:pr-16 ${getModalHeaderColor(selectedBooking.status)}`}>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">สถานะการจอง</p>
                <h3 className="mt-1 text-lg font-bold leading-6 sm:text-xl">{getModalHeaderText(selectedBooking.status)}</h3>
              </div>
            </div>
              <div className="rounded-[1.25rem] border border-gray-100 bg-gray-50 px-5 py-4">
                <h4 className="mb-3 text-sm font-bold text-gray-800">ข้อมูลการจอง</h4>
                <div className="grid gap-3 text-sm grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-gray-500">เลขที่จอง</p>
                    <p className="mt-1 font-bold text-gray-800">#{selectedBooking.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">วันที่จอง</p>
                    <p className="mt-1 font-semibold text-gray-700">{formatDateTime(selectedBooking.createdAt)}</p>
                  </div>
                  {selectedBooking.paidAt && (
                    <div>
                      <p className="text-gray-500">ชำระเงินเมื่อ</p>
                      <p className="mt-1 font-semibold text-gray-700">{formatDateTime(selectedBooking.paidAt)}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid gap-5 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_15rem]">
                <div className="rounded-[1.5rem] border border-gray-100 bg-white p-5">
                  <h4 className="mb-4 text-sm font-bold text-gray-800">รายละเอียดทัวร์</h4>
                  <div className="space-y-3 text-sm leading-7 text-gray-700">
                    <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] gap-2 sm:gap-3">
                      <span className="font-bold text-gray-800">รหัสทัวร์</span>
                      <span>{selectedBooking.tourCode}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] gap-2 sm:gap-3">
                      <span className="font-bold text-gray-800">ชื่อทัวร์</span>
                      <span>{selectedBooking.tourName}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] gap-2 sm:gap-3">
                      <span className="font-bold text-gray-800">วันที่เดินทาง</span>
                      <span>{formatTravelDate(selectedBooking)}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] gap-2 sm:gap-3">
                      <span className="font-bold text-gray-800">จำนวนผู้เดินทาง</span>
                      <span>ผู้ใหญ่ {selectedBooking.adults}, เด็ก {selectedBooking.children}</span>
                    </div>
                    {selectedBooking.accommodation && (
                      <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] gap-2 sm:gap-3">
                        <span className="font-bold text-gray-800">ที่พัก</span>
                        <span>{selectedBooking.accommodation}</span>
                      </div>
                    )}
                  </div>
                </div>

                <img
                  src={selectedBooking.image}
                  alt={selectedBooking.tourName}
                  className={`h-48 w-full rounded-[1.25rem] border border-gray-100 object-cover lg:h-full ${selectedBooking.status === 'ยกเลิกแล้ว' ? 'grayscale' : ''}`}
                />
              </div>

              {!selectedHidePriceBreakdown && (
                <div className="rounded-[1.5rem] border border-gray-100 bg-gray-50 p-5">
                  <h4 className="mb-3 text-sm font-bold text-gray-800">รายละเอียดราคา</h4>
                  <div className="space-y-3 text-sm">
                    {selectedBooking.adults > 0 && (
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-gray-600">ผู้ใหญ่</span>
                        <span className="text-gray-400">{selectedBooking.adultPrice > 0 ? `${selectedBooking.adultPrice.toLocaleString()} × ${selectedBooking.adults}` : `(${selectedBooking.adults} ท่าน)`}</span>
                        <span className="font-bold text-gray-800">{selectedBooking.adultPrice > 0 ? `${(selectedBooking.adults * selectedBooking.adultPrice).toLocaleString()} บาท` : '-'}</span>
                      </div>
                    )}
                    {selectedBooking.children > 0 && (
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium text-gray-600">เด็ก</span>
                        <span className="text-gray-400">{selectedBooking.childPrice > 0 ? `${selectedBooking.childPrice.toLocaleString()} × ${selectedBooking.children}` : `(${selectedBooking.children} ท่าน)`}</span>
                        <span className="font-bold text-gray-800">{selectedBooking.childPrice > 0 ? `${(selectedBooking.children * selectedBooking.childPrice).toLocaleString()} บาท` : '-'}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-5 flex items-end justify-between border-t border-gray-200 pt-5">
                    <span className="font-bold text-gray-800">ยอดที่ต้องชำระ</span>
                    <div className="text-right">
                      <span className={`text-4xl font-black ${selectedBooking.status === 'ยกเลิกแล้ว' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {Math.round(selectedBooking.price).toLocaleString()}
                      </span>
                      <span className="ml-2 text-base font-bold text-gray-800">บาท</span>
                    </div>
                  </div>
                </div>
              )}

              {showBookingExtraDetails && (
                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="rounded-[1.5rem] border border-gray-100 bg-white p-5">
                    <h4 className="mb-4 text-sm font-bold text-gray-800">ข้อมูลติดต่อผู้จอง</h4>
                    <div className="space-y-3 text-sm leading-7 text-gray-700">
                      <div className="grid grid-cols-[90px_1fr] sm:grid-cols-[110px_1fr] gap-2 sm:gap-3">
                        <span className="font-bold text-gray-800">ชื่อผู้จอง</span>
                        <span>{selectedContactName}</span>
                      </div>
                      <div className="grid grid-cols-[90px_1fr] sm:grid-cols-[110px_1fr] gap-2 sm:gap-3">
                        <span className="font-bold text-gray-800">อีเมล</span>
                        <span className="break-all">{selectedBooking.contactEmail || '-'}</span>
                      </div>
                      <div className="grid grid-cols-[90px_1fr] sm:grid-cols-[110px_1fr] gap-2 sm:gap-3">
                        <span className="font-bold text-gray-800">โทรศัพท์</span>
                        <span>{selectedBooking.contactPhone || '-'}</span>
                      </div>
                      {selectedBooking.specialRequest && (
                        <div className="grid grid-cols-[90px_1fr] sm:grid-cols-[110px_1fr] gap-2 sm:gap-3">
                          <span className="font-bold text-gray-800">คำขอเพิ่มเติม</span>
                          <span className="whitespace-pre-wrap">{selectedBooking.specialRequest}</span>
                        </div>
                      )}
                      {selectedBooking.cancellationReason && (
                        <div className="grid grid-cols-[90px_1fr] sm:grid-cols-[110px_1fr] gap-2 sm:gap-3">
                          <span className="font-bold text-gray-800">เหตุผลยกเลิก</span>
                          <span className="whitespace-pre-wrap text-red-600">{selectedBooking.cancellationReason}</span>
                        </div>
                      )}
                    </div>

                    {selectedBooking.travelersInfo.length > 0 && (
                      <div className="mt-4 border-t border-gray-100 pt-4">
                        <h5 className="mb-2 text-sm font-bold text-gray-800">รายชื่อผู้เดินทาง</h5>
                        <div className="space-y-1.5">
                          {selectedBooking.travelersInfo.map((traveler, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                              <span className="font-medium">{index + 1}.</span>
                              <span>{traveler.name}</span>
                              {traveler.isLeadTraveler && (
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">หัวหน้าทริป</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-[1.5rem] border border-gray-100 bg-gray-50 p-5">
                    <h4 className="mb-4 text-sm font-bold text-gray-800">ข้อมูลทัวร์เพิ่มเติม</h4>
                    <div className="space-y-3 text-sm leading-7 text-gray-700">
                      <div className="grid grid-cols-[90px_1fr] sm:grid-cols-[110px_1fr] gap-2 sm:gap-3">
                        <span className="font-bold text-gray-800">รอบเดินทาง</span>
                        <span>{selectedRoundLabel}</span>
                      </div>
                      <div className="grid grid-cols-[90px_1fr] sm:grid-cols-[110px_1fr] gap-2 sm:gap-3">
                        <span className="font-bold text-gray-800">ระยะเวลา</span>
                        <span>{selectedBooking.duration || '-'}</span>
                      </div>
                      <div className="grid grid-cols-[90px_1fr] sm:grid-cols-[110px_1fr] gap-2 sm:gap-3">
                        <span className="font-bold text-gray-800">การเดินทาง</span>
                        <span>{selectedBooking.transportation || '-'}</span>
                      </div>

                      {selectedTourNotes.length > 0 && (
                        <div className="grid grid-cols-[90px_1fr] sm:grid-cols-[110px_1fr] gap-2 sm:gap-3">
                          <span className="font-bold text-gray-800">คำแนะนำ</span>
                          <div className="flex flex-wrap gap-2 pt-0.5">
                            {selectedTourNotes.map((note) => (
                              <span
                                key={note}
                                className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600 ring-1 ring-inset ring-gray-200"
                              >
                                {note}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedItineraryPreview.length > 0 && (
                        <div className="grid grid-cols-[90px_1fr] sm:grid-cols-[110px_1fr] gap-2 sm:gap-3">
                          <span className="font-bold text-gray-800">กำหนดการ</span>
                          <div className="space-y-2">
                            {selectedItineraryPreview.map((item, index) => (
                              <div key={`${item.time}-${item.title}-${index}`} className="rounded-2xl bg-white px-3 py-2 ring-1 ring-inset ring-gray-200">
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
                                  {[item.day ? `Day ${item.day}` : null, item.time || null].filter(Boolean).join(' • ') || `ช่วงที่ ${index + 1}`}
                                </p>
                                <p className="mt-1 font-semibold text-gray-800">{item.title}</p>
                                {item.description && (
                                  <p className="mt-0.5 line-clamp-2 text-gray-500">{item.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {selectedCanCancel ? (
                  <p className="text-xs text-gray-400">สามารถยกเลิกได้ก่อนวันเดินทางอย่างน้อย 7 วัน</p>
                ) : (
                  <span />
                )}
                <div className="flex flex-col gap-3 sm:ml-auto sm:flex-row">
                  {selectedCanPay && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBooking(null)
                        navigate(`/payment/${selectedBooking.id}`)
                      }}
                      className="ui-focus-ring ui-pressable rounded-full bg-primary px-6 py-3 text-base font-bold text-white hover:bg-primary-dark"
                    >
                      ชำระเงิน
                    </button>
                  )}
                  {selectedCanCancel && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBooking(null)
                        setCancelModalId(String(selectedBooking.id))
                      }}
                      className="ui-focus-ring ui-pressable rounded-full border border-red-200 bg-white px-6 py-3 text-base font-bold text-red-500 hover:bg-red-50"
                    >
                      ยกเลิกการจอง
                    </button>
                  )}
                </div>
              </div>
            </div>
        )}
      </Modal>

      <Modal isOpen={cancelModalId !== null} onClose={() => { setCancelModalId(null); setCancelReason('') }} width="max-w-md">
        <div className="space-y-5">
          <div className="flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900">ยืนยันการยกเลิก</h3>
            <p className="mt-2 text-sm leading-6 text-gray-500">หากยกเลิกแล้วจะไม่สามารถย้อนกลับได้</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">เหตุผลการยกเลิก (ไม่บังคับ)</label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="เช่น ติดธุระไม่สะดวก, เปลี่ยนแผนการเดินทาง"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-yellow-400 focus:bg-white"
            />
            <p className="mt-1 text-right text-xs text-gray-400">{cancelReason.length}/500</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => { setCancelModalId(null); setCancelReason('') }}
              className="ui-focus-ring ui-pressable flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              ปิดหน้าต่าง
            </button>
            <button
              type="button"
              onClick={() => cancelModalId && handleCancelBooking(cancelModalId)}
              className="ui-focus-ring ui-pressable flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
            >
              ยืนยันยกเลิก
            </button>
          </div>
        </div>
      </Modal>

      {reviewBooking && (
        <ReviewModal
          isOpen={reviewBooking !== null}
          onClose={() => setReviewBooking(null)}
          bookingId={reviewBooking.id}
          tourName={reviewBooking.tourName}
          onSuccess={() => void loadBookings()}
        />
      )}
    </div>
  )
}


