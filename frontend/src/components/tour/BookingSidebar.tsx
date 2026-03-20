import { useEffect, useMemo, useRef, useState, type SyntheticEvent, type TouchEvent } from 'react'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import type { Tour, TourSchedule } from '../../types/tour'
import { useAuth } from '../../context/AuthContext'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
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
  isMobileFixed?: boolean
}

const MOBILE_DRAWER_PEEK_HEIGHT = 150
const MOBILE_DRAWER_DRAG_THRESHOLD = 72

function getLocalTodayIsoDate() {
  const now = new Date()
  const local = new Date(now.getTime() - (now.getTimezoneOffset() * 60 * 1000))
  return local.toISOString().slice(0, 10)
}

export default function BookingSidebar({ tour, isMobileFixed = false }: BookingSidebarProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const shouldUseDrawer = isMobileFixed
  const today = useMemo(() => getLocalTodayIsoDate(), [])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartY = useRef(0)
  const gestureOffsetYRef = useRef(0)
  const suppressHeaderClickRef = useRef(false)

  const upcomingSchedules = useMemo(() => {
    return [...tour.schedules]
      .filter((schedule: TourSchedule) => schedule.startDate >= today)
      .sort((a: TourSchedule, b: TourSchedule) => a.startDate.localeCompare(b.startDate))
  }, [tour.schedules, today])

  const defaultSelectedSchedule = useMemo(() => {
    return upcomingSchedules.find(
      (schedule: TourSchedule) => schedule.maxCapacity - schedule.currentBooked > 0,
    ) ?? upcomingSchedules[0] ?? null
  }, [upcomingSchedules])

  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(defaultSelectedSchedule?.id ?? null)
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [availableSeatsData, setAvailableSeatsData] = useState<{ [key: number]: number | null }>({})
  const [pendingBookingMap, setPendingBookingMap] = useState<Map<number, number>>(new Map())
  const [fetchKey, setFetchKey] = useState(1)
  const scrollRef = useRef<HTMLDivElement>(null)
  const drawerContentRef = useRef<HTMLDivElement>(null)
  const selectedSchedule = upcomingSchedules.find((schedule) => schedule.id === selectedScheduleId) ?? defaultSelectedSchedule

  useBodyScrollLock(shouldUseDrawer && drawerOpen, { allowTouchMoveRefs: [drawerContentRef] })

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

    const visibleSchedules = selectedMonth === 'all'
      ? upcomingSchedules.slice(0, 30)
      : upcomingSchedules.filter((schedule) => schedule.startDate.startsWith(selectedMonth))

    const schedulesToFetch = visibleSchedules.filter((schedule) => availableSeatsData[schedule.id] == null)
    if (schedulesToFetch.length === 0) return

    let cancelled = false
    const fetchVisibleSeats = async () => {
      const results: { [key: number]: number | null } = {}
      await Promise.all(
        schedulesToFetch.map(async (schedule: TourSchedule) => {
          try {
            const data = await tourService.getAvailableSeats(tour.id, schedule.id)
            results[schedule.id] = Math.max(0, data.availableSeats)
          } catch {
            results[schedule.id] = Math.max(0, schedule.maxCapacity - schedule.currentBooked)
          }
        }),
      )

      if (!cancelled) {
        setAvailableSeatsData((prev) => ({ ...prev, ...results }))
      }
    }

    void fetchVisibleSeats()
    return () => { cancelled = true }
  }, [tour?.id, selectedMonth, upcomingSchedules, fetchKey, availableSeatsData])

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

  const handleDrawerToggle = () => setDrawerOpen((prev) => !prev)
  const handleDrawerClose = () => {
    setDrawerOpen(false)
    setIsDragging(false)
    setDragY(0)
  }

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    if (!shouldUseDrawer) return

    event.preventDefault()
    touchStartY.current = event.touches[0].clientY
    gestureOffsetYRef.current = 0
    setDragY(0)
    setIsDragging(true)
  }

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return

    event.preventDefault()

    const currentY = event.touches[0].clientY
    const diff = currentY - touchStartY.current
    gestureOffsetYRef.current = diff

    if (drawerOpen) {
      setDragY(Math.max(0, diff))
      return
    }

    setDragY(0)
  }

  const handleTouchEnd = () => {
    if (!isDragging) return

    setIsDragging(false)
    suppressHeaderClickRef.current = true
    window.setTimeout(() => {
      suppressHeaderClickRef.current = false
    }, 0)

    if (drawerOpen && gestureOffsetYRef.current > MOBILE_DRAWER_DRAG_THRESHOLD) {
      setDrawerOpen(false)
    } else if (!drawerOpen && gestureOffsetYRef.current < -MOBILE_DRAWER_DRAG_THRESHOLD) {
      setDrawerOpen(true)
    }

    gestureOffsetYRef.current = 0
    setDragY(0)
  }

  const handleHeaderClick = () => {
    if (suppressHeaderClickRef.current) {
      suppressHeaderClickRef.current = false
      return
    }
    if (isDragging) return
    handleDrawerToggle()
  }

  const stopTogglePropagation = (event: SyntheticEvent) => {
    event.stopPropagation()
  }

  const summaryLabel = isPrivate ? 'ราคาเหมาจ่ายทั้งกลุ่ม' : 'ยอดชำระรวม'

  const renderContent = (isDrawer: boolean) => (
    <>
      <BookingPriceHeader tour={tour} isDrawer={isDrawer} />

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
    </>
  )

  return (
    <>
      {shouldUseDrawer && (
        <>
          <div
            data-testid="booking-drawer-backdrop"
            className={`fixed inset-0 z-30 bg-black/20 backdrop-blur-[2px] lg:hidden transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
            onClick={handleDrawerClose}
          />
          <div
            className={`fixed inset-x-0 bottom-2 z-40 px-3 pb-[env(safe-area-inset-bottom,1rem)] pt-2 lg:hidden ${isDragging ? '' : 'transition-all duration-300 ease-out'} ${!isDragging && drawerOpen ? 'translate-y-0' : !isDragging ? 'translate-y-[calc(100%-150px)]' : ''}`}
            style={isDragging
              ? (drawerOpen
                ? { transform: `translateY(${dragY}px)` }
                : { transform: `translateY(calc(100% - ${MOBILE_DRAWER_PEEK_HEIGHT}px))` })
              : undefined}
          >
            <div className={`ui-surface relative rounded-[1.5rem] border border-gray-200 bg-white px-3 py-4 overflow-hidden transition-shadow duration-300 ${drawerOpen ? 'shadow-[0_-8px_50px_rgba(15,23,42,0.3)]' : 'shadow-[0_-4px_30px_rgba(15,23,42,0.15)]'}`}>
              <div
                data-testid="booking-drawer-header"
                className="cursor-pointer select-none touch-none"
                onClick={handleHeaderClick}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <button
                  type="button"
                  data-testid="booking-drawer-handle"
                  aria-controls="mobile-booking-drawer-content"
                  aria-expanded={drawerOpen}
                  aria-label={drawerOpen ? 'ย่อรายละเอียดการจอง' : 'ขยายรายละเอียดการจอง'}
                  className="mx-auto mb-3 flex h-5 w-16 cursor-grab items-center justify-center active:cursor-grabbing"
                  onClick={(event) => {
                    stopTogglePropagation(event)
                    handleDrawerToggle()
                  }}
                >
                  <div className={`h-1.5 w-12 rounded-full transition-all duration-300 ${drawerOpen ? 'bg-gray-400 w-10' : 'bg-gray-300 w-12'}`} />
                </button>

                <div className={`transition-all duration-300 ease-out ${drawerOpen ? 'mb-0 h-0 overflow-hidden opacity-0' : 'mb-3 opacity-100'}`}>
                  <p className="mb-2 text-center text-[14px] font-medium text-gray-400">
                    ปัดขึ้นเพื่อจอง
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{summaryLabel}</p>
                      <p className="text-xl font-bold text-gray-900">฿{totalPrice.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          stopTogglePropagation(event)
                          handleDrawerToggle()
                        }}
                        className="ui-pressable rounded-xl border border-primary bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-transform active:scale-95"
                      >
                        ดูรายละเอียด
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div
                id="mobile-booking-drawer-content"
                data-testid="booking-drawer-content"
                ref={drawerContentRef}
                className={`transition-all duration-300 ease-out ${drawerOpen ? 'max-h-[60vh] overflow-y-auto overflow-x-hidden overscroll-contain scrollbar-hide touch-pan-y opacity-100' : 'max-h-0 overflow-hidden opacity-0'}`}
              >
                <div className="pb-3">
                  {renderContent(true)}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className={shouldUseDrawer ? 'hidden lg:block' : ''}>
        <div className="ui-surface rounded-[1.5rem] border border-gray-100 bg-white p-4 sm:rounded-[1.75rem] sm:p-5 lg:sticky lg:top-24">
          {renderContent(false)}
        </div>
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
