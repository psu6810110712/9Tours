import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import ConfirmModal from '../components/common/ConfirmModal'
import Modal from '../components/common/Modal'
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
}

const tabs = ['ทั้งหมด', 'รอชำระเงิน', 'รอตรวจสอบ', 'สำเร็จ', 'ยกเลิกแล้ว']
const CANCELLABLE_STATUSES = ['รอชำระเงิน', 'รอตรวจสอบ', 'สำเร็จ']
const PRICE_BREAKDOWN_HIDDEN_STATUSES = ['รอตรวจสอบ', 'สำเร็จ']

export default function MyBookingPage() {
  const [activeTab, setActiveTab] = useState('ทั้งหมด')
  const [bookings, setBookings] = useState<MyBookingItem[]>([])
  const [selectedBooking, setSelectedBooking] = useState<MyBookingItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelModalId, setCancelModalId] = useState<string | null>(null)
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
      await bookingService.cancelBooking(bookingId)
      toast.success('ยกเลิกการจองสำเร็จ')
      setCancelModalId(null)
      await loadBookings()
    } catch (error: unknown) {
      const resolvedError = error as { response?: { data?: { message?: string } } }
      console.error('Error canceling booking:', error)
      toast.error(resolvedError.response?.data?.message || 'เกิดข้อผิดพลาดในการยกเลิก กรุณาลองใหม่อีกครั้ง')
      setCancelModalId(null)
    }
  }

  const filteredBookings = useMemo(() => (
    activeTab === 'ทั้งหมด'
      ? bookings
      : bookings.filter((booking) => booking.status === activeTab)
  ), [activeTab, bookings])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'รอชำระเงิน': return 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20'
      case 'รอตรวจสอบ': return 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20'
      case 'สำเร็จ': return 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
      case 'ยกเลิกแล้ว': return 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10'
      default: return 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10'
    }
  }

  const getModalHeaderColor = (status: string) => {
    switch (status) {
      case 'รอชำระเงิน': return 'bg-[#FFC107]'
      case 'รอตรวจสอบ': return 'bg-[#F97316]'
      case 'สำเร็จ': return 'bg-[#10B981]'
      case 'ยกเลิกแล้ว': return 'bg-[#EF4444]'
      default: return 'bg-gray-500'
    }
  }

  const getModalHeaderText = (status: string) => {
    switch (status) {
      case 'รอชำระเงิน': return 'อยู่ระหว่างการรอชำระเงิน'
      case 'รอตรวจสอบ': return 'รอการตรวจสอบ'
      case 'สำเร็จ': return 'ชำระเงินแล้ว'
      case 'ยกเลิกแล้ว': return 'ยกเลิกแล้ว'
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
          <h1 className="text-2xl font-black text-gray-900">การจองของฉัน</h1>
          <p className="mt-2 text-sm text-gray-500">ตรวจสอบสถานะ ชำระเงิน และดูรายละเอียดรายการจองของคุณได้ที่นี่</p>
        </div>

        <div className="scrollbar-hide mb-8 flex gap-3 overflow-x-auto border-b border-gray-200 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${activeTab === tab ? 'bg-primary text-white shadow-sm' : 'bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="space-y-4">
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
                className={`ui-surface rounded-[1.5rem] border p-5 ${booking.status === 'ยกเลิกแล้ว' ? 'border-red-100 opacity-75' : 'border-gray-100'}`}
              >
                <div className="flex flex-col gap-5 md:flex-row">
                  <div className="h-36 w-full overflow-hidden rounded-[1.25rem] md:w-48">
                    <img src={booking.image} alt="tour" className={`h-full w-full object-cover ${booking.status === 'ยกเลิกแล้ว' ? 'grayscale' : ''}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${getStatusBadge(booking.status)}`}>
                          <svg className="h-1.5 w-1.5 fill-current" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" /></svg>
                          {booking.status}
                        </span>
                        <h3 className={`mt-3 text-xl font-bold leading-snug ${booking.status === 'ยกเลิกแล้ว' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {booking.tourName}
                        </h3>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                          <span>
                            รหัสทัวร์ <span className="font-mono font-semibold tracking-wide text-gray-700">{booking.tourCode}</span>
                          </span>
                          {showCompactAmount && (
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${booking.status === 'ยกเลิกแล้ว' ? 'bg-gray-100 text-gray-400 line-through' : 'bg-gray-100 text-gray-600'}`}>
                              ยอดชำระ {Math.round(booking.price).toLocaleString()} บาท
                            </span>
                          )}
                        </div>
                      </div>

                      {showPrimaryAmount && (
                        <div className="rounded-[1.25rem] bg-gray-50 px-4 py-3 text-left md:min-w-[160px] md:text-right">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">ยอดชำระ</p>
                          <p className="mt-2 text-2xl font-black text-gray-900">{Math.round(booking.price).toLocaleString()}</p>
                          <p className="text-sm font-semibold text-gray-500">บาท</p>
                        </div>
                      )}
                    </div>

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

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      {booking.status === 'ยกเลิกแล้ว' ? (
                        <p className="text-xs text-gray-400">รายการนี้ถูกยกเลิกแล้ว</p>
                      ) : canCancel ? (
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
              <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
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

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_15rem]">
              <div className="rounded-[1.5rem] border border-gray-100 bg-white p-5">
                <h4 className="mb-4 text-sm font-bold text-gray-800">รายละเอียดทัวร์</h4>
                <div className="space-y-3 text-sm leading-7 text-gray-700">
                  <div className="grid grid-cols-[120px_1fr] gap-3">
                    <span className="font-bold text-gray-800">รหัสทัวร์</span>
                    <span>{selectedBooking.tourCode}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-3">
                    <span className="font-bold text-gray-800">ชื่อทัวร์</span>
                    <span>{selectedBooking.tourName}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-3">
                    <span className="font-bold text-gray-800">วันที่เดินทาง</span>
                    <span>{formatTravelDate(selectedBooking)}</span>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] gap-3">
                    <span className="font-bold text-gray-800">จำนวนผู้เดินทาง</span>
                    <span>ผู้ใหญ่ {selectedBooking.adults}, เด็ก {selectedBooking.children}</span>
                  </div>
                  {selectedBooking.accommodation && (
                    <div className="grid grid-cols-[120px_1fr] gap-3">
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
                    <div className="grid grid-cols-[110px_1fr] gap-3">
                      <span className="font-bold text-gray-800">ชื่อผู้จอง</span>
                      <span>{selectedContactName}</span>
                    </div>
                    <div className="grid grid-cols-[110px_1fr] gap-3">
                      <span className="font-bold text-gray-800">อีเมล</span>
                      <span className="break-all">{selectedBooking.contactEmail || '-'}</span>
                    </div>
                    <div className="grid grid-cols-[110px_1fr] gap-3">
                      <span className="font-bold text-gray-800">โทรศัพท์</span>
                      <span>{selectedBooking.contactPhone || '-'}</span>
                    </div>
                    {selectedBooking.specialRequest && (
                      <div className="grid grid-cols-[110px_1fr] gap-3">
                        <span className="font-bold text-gray-800">คำขอเพิ่มเติม</span>
                        <span className="whitespace-pre-wrap">{selectedBooking.specialRequest}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-gray-100 bg-gray-50 p-5">
                  <h4 className="mb-4 text-sm font-bold text-gray-800">ข้อมูลทัวร์เพิ่มเติม</h4>
                  <div className="space-y-3 text-sm leading-7 text-gray-700">
                    <div className="grid grid-cols-[110px_1fr] gap-3">
                      <span className="font-bold text-gray-800">รอบเดินทาง</span>
                      <span>{selectedRoundLabel}</span>
                    </div>
                    <div className="grid grid-cols-[110px_1fr] gap-3">
                      <span className="font-bold text-gray-800">ระยะเวลา</span>
                      <span>{selectedBooking.duration || '-'}</span>
                    </div>
                    <div className="grid grid-cols-[110px_1fr] gap-3">
                      <span className="font-bold text-gray-800">การเดินทาง</span>
                      <span>{selectedBooking.transportation || '-'}</span>
                    </div>

                    {selectedTourNotes.length > 0 && (
                      <div className="grid grid-cols-[110px_1fr] gap-3">
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
                      <div className="grid grid-cols-[110px_1fr] gap-3">
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

      <ConfirmModal
        isOpen={cancelModalId !== null}
        title="ยืนยันการยกเลิก"
        message="หากยกเลิกแล้วจะไม่สามารถย้อนกลับได้"
        confirmText="ยืนยันยกเลิก"
        cancelText="ปิดหน้าต่าง"
        confirmStyle="danger"
        onConfirm={() => cancelModalId && handleCancelBooking(cancelModalId)}
        onCancel={() => setCancelModalId(null)}
      />
    </div>
  )
}


