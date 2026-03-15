import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import type { Tour, TourSchedule } from '../../types/tour'
import { useAuth } from '../../context/AuthContext'
import { bookingService } from '../../services/bookingService'
import { trackEvent } from '../../services/trackingService'
import { tourService } from '../../services/tourService'
import LoginModal from '../LoginModal'
import BookingDateSelector from './booking-sidebar/BookingDateSelector'
import BookingGuestSelector from './booking-sidebar/BookingGuestSelector'
import BookingPriceHeader from './booking-sidebar/BookingPriceHeader'
import BookingSummary from './booking-sidebar/BookingSummary'

interface BookingSidebarProps {
  tour: Tour
}

export default function BookingSidebar({ tour }: BookingSidebarProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const today = useRef(new Date().toISOString().slice(0, 10)).current

  const upcomingSchedules = tour.schedules
    .filter((schedule: TourSchedule) => schedule.startDate >= today)
    .sort((a: TourSchedule, b: TourSchedule) => a.startDate.localeCompare(b.startDate))

  const defaultSelectedSchedule = upcomingSchedules.find(
    (schedule: TourSchedule) => schedule.maxCapacity - schedule.currentBooked > 0,
  ) ?? upcomingSchedules[0] ?? null

  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(defaultSelectedSchedule?.id ?? null)
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [availableSeatsData, setAvailableSeatsData] = useState<{ [key: number]: number | null }>({})
  const [pendingBookingMap, setPendingBookingMap] = useState<Map<number, number>>(new Map())
  const [fetchKey, setFetchKey] = useState(1)
  const scrollRef = useRef<HTMLDivElement>(null)
  const selectedSchedule = upcomingSchedules.find((schedule) => schedule.id === selectedScheduleId) ?? defaultSelectedSchedule

  const availableMonths = useMemo(() => {
    const months = new Set<string>()
    upcomingSchedules.forEach((schedule: TourSchedule) => {
      const parts = schedule.startDate.split('-')
      if (parts.length >= 2) months.add(`${parts[0]}-${parts[1]}`)
    })
    return Array.from(months).sort()
  }, [upcomingSchedules])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setFetchKey((prev) => prev + 1)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    if (!user) return

    bookingService.getMyBookings()
      .then((bookings) => {
        const map = new Map<number, number>()
        bookings
          .filter((booking) => booking.status === 'pending_payment')
          .forEach((booking) => map.set(booking.scheduleId, booking.id))
        setPendingBookingMap(map)
      })
      .catch(() => undefined)
  }, [user, fetchKey])

  useEffect(() => {
    if (!tour?.id || upcomingSchedules.length === 0) return

    const fetchAllSeats = async () => {
      const results: { [key: number]: number | null } = {}
      await Promise.all(
        upcomingSchedules.map(async (schedule: TourSchedule) => {
          try {
            const data = await tourService.getAvailableSeats(tour.id, schedule.id)
            results[schedule.id] = Math.max(0, data.availableSeats)
          } catch {
            results[schedule.id] = Math.max(0, schedule.maxCapacity - schedule.currentBooked)
          }
        }),
      )
      setAvailableSeatsData(results)
    }

    void fetchAllSeats()
  }, [tour?.id, upcomingSchedules, fetchKey])

  const seatsLeft = selectedSchedule
    ? Math.max(0, availableSeatsData[selectedSchedule.id] ?? (selectedSchedule.maxCapacity - selectedSchedule.currentBooked))
    : 0
  const totalGuests = adults + children
  const isPrivate = !!tour?.minPeople
  const totalPrice = isPrivate
    ? Number(tour?.price || 0)
    : Number(tour?.price || 1500) * adults + Number(tour?.childPrice || 1000) * children

  const isMaxReached = isPrivate
    ? (tour?.maxPeople ? totalGuests >= tour.maxPeople : false)
    : (totalGuests >= seatsLeft)

  const isSoldOut = selectedSchedule && seatsLeft <= 0
  const isExceedCapacity = !isPrivate && totalGuests > seatsLeft
  const selectedSchedulePendingBookingId = selectedSchedule ? pendingBookingMap.get(selectedSchedule.id) : undefined
  const hasAnyPendingBooking = pendingBookingMap.size > 0
  const hasSelectedSchedulePendingBooking = typeof selectedSchedulePendingBookingId === 'number'
  const hasOtherPendingBooking = hasAnyPendingBooking && !hasSelectedSchedulePendingBooking
  const isBookingDisabled = !hasAnyPendingBooking && (!upcomingSchedules.length || !selectedSchedule || isSoldOut || isExceedCapacity)

  let buttonText = 'จองเลย'
  if (hasSelectedSchedulePendingBooking) buttonText = 'ไปชำระรายการเดิม'
  else if (hasOtherPendingBooking) buttonText = 'จัดการรายการค้างชำระ'
  else if (!upcomingSchedules.length || !selectedSchedule) buttonText = 'ไม่มีรอบเปิดรับ'
  else if (isSoldOut && isPrivate) buttonText = 'รอบนี้ถูกจองแล้ว'
  else if (isSoldOut) buttonText = 'รอบนี้เต็มแล้ว'
  else if (isExceedCapacity) buttonText = 'ที่นั่งไม่พอ'

  const handleBookingClick = () => {
    trackEvent({
      eventType: 'cta_click',
      pagePath: window.location.pathname + window.location.search,
      tourId: tour.id,
      elementId: 'booking_sidebar_primary_button',
      metadata: {
        selectedScheduleId: selectedSchedule?.id ?? null,
        adults,
        children,
        hasPendingBooking: hasAnyPendingBooking,
        hasSelectedSchedulePendingBooking,
        hasOtherPendingBooking,
      },
    })

    if (!user) {
      setShowLoginModal(true)
      return
    }

    if (hasSelectedSchedulePendingBooking && selectedSchedulePendingBookingId) {
      navigate(`/payment/${selectedSchedulePendingBookingId}`)
      return
    }

    if (hasOtherPendingBooking) {
      toast.error('คุณมีรายการรอชำระรายการอื่นอยู่ กรุณาชำระหรือยกเลิกรายการเดิมก่อนเริ่มการจองใหม่')
      navigate('/my-bookings')
      return
    }

    const targetScheduleId = selectedSchedule ? selectedSchedule.id : '-'
    navigate(`/booking/${tour.id}?scheduleId=${targetScheduleId}&adults=${adults}&children=${children}`)
  }

  return (
    <>
      <div className="ui-surface rounded-[1.75rem] border border-gray-100 bg-white p-5 lg:sticky lg:top-24">
        <BookingPriceHeader tour={tour} />

        <BookingDateSelector
          tour={tour}
          upcomingSchedules={upcomingSchedules}
          availableMonths={availableMonths}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedSchedule={selectedSchedule}
          setSelectedSchedule={(schedule) => setSelectedScheduleId(schedule.id)}
          scrollRef={scrollRef}
          availableSeatsData={availableSeatsData}
        />

        <BookingGuestSelector
          tour={tour}
          adults={adults}
          setAdults={setAdults}
          children={children}
          setChildren={setChildren}
          isMaxReached={isMaxReached}
          hasSelectedSchedule={!!selectedSchedule}
        />

        <BookingSummary
          tour={tour}
          adults={adults}
          children={children}
          totalPrice={totalPrice}
          isBookingDisabled={isBookingDisabled}
          buttonText={buttonText}
          onBookingClick={handleBookingClick}
        />
      </div>

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSwitchToRegister={() => {
            setShowLoginModal(false)
            navigate('/')
          }}
        />
      )}
    </>
  )
}
