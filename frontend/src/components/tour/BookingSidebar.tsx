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
  isMobileFixed?: boolean
}

function getLocalTodayIsoDate() {
  const now = new Date()
  const local = new Date(now.getTime() - (now.getTimezoneOffset() * 60 * 1000))
  return local.toISOString().slice(0, 10)
}

export default function BookingSidebar({ tour, isMobileFixed = false }: BookingSidebarProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const today = useRef(getLocalTodayIsoDate()).current
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartY = useRef(0)
  const drawerRef = useRef<HTMLDivElement>(null)

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

    const visibleSchedules = selectedMonth === 'all'
      ? upcomingSchedules.slice(0, 30)
      : upcomingSchedules.filter((s) => s.startDate.startsWith(selectedMonth))

    const schedulesToFetch = visibleSchedules.filter((s) => availableSeatsData[s.id] == null)
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
  }, [tour?.id, selectedMonth, upcomingSchedules, fetchKey])

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

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
  const handleDrawerClose = () => setDrawerOpen(false)
  const shouldUseDrawer = isMobileFixed

  // Touch gesture handlers for drawer
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const currentY = e.touches[0].clientY
    const diff = currentY - touchStartY.current
    
    // When drawer is open, only allow dragging down (positive diff)
    // When drawer is closed, only allow dragging up (negative diff)
    if (drawerOpen) {
      setDragY(Math.max(0, diff))
    } else {
      setDragY(Math.min(0, diff))
    }
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    
    const threshold = 80 // pixels to trigger open/close
    
    if (drawerOpen && dragY > threshold) {
      // Swipe down while open -> close
      setDrawerOpen(false)
    } else if (!drawerOpen && dragY < -threshold) {
      // Swipe up while closed -> open
      setDrawerOpen(true)
    }
    
    setDragY(0)
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
          {/* Backdrop overlay with fade */}
          <div 
            className={`fixed inset-0 z-30 bg-black/20 backdrop-blur-[2px] lg:hidden transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={handleDrawerClose}
          />
          <div 
            ref={drawerRef}
            className={`fixed inset-x-0 bottom-0 z-40 px-4 pb-[env(safe-area-inset-bottom,1rem)] pt-2 lg:hidden ${isDragging ? '' : 'transition-all duration-300 ease-out'} ${!isDragging && drawerOpen ? 'translate-y-0' : !isDragging ? 'translate-y-[calc(100%-150px)]' : ''}`}
            style={isDragging ? { transform: drawerOpen ? `translateY(${dragY}px)` : `translateY(calc(100% - 150px + ${dragY}px))` } : undefined}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className={`ui-surface relative rounded-[1.5rem] border border-gray-200 bg-white p-4 overflow-hidden transition-shadow duration-300 ${drawerOpen ? 'shadow-[0_-8px_50px_rgba(15,23,42,0.3)]' : 'shadow-[0_-4px_30px_rgba(15,23,42,0.15)]'}`}>
              {/* Drag handle */}
              <div className="mx-auto mb-3 flex h-5 w-16 cursor-grab items-center justify-center active:cursor-grabbing" onClick={handleDrawerToggle}>
                <div className={`h-1.5 w-12 rounded-full transition-all duration-300 ${drawerOpen ? 'bg-gray-400 w-10' : 'bg-gray-300 w-12'}`} />
              </div>
              <div className={`flex items-center justify-between gap-3 transition-all duration-300 ease-out ${drawerOpen ? 'h-0 overflow-hidden opacity-0 mb-0' : 'mb-3 opacity-100'}`}>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{summaryLabel}</p>
                  <p className="text-xl font-bold text-gray-900">฿{totalPrice.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={handleDrawerToggle} className="ui-pressable rounded-xl border border-primary bg-primary px-3 py-2 text-xs font-semibold text-white transition-transform active:scale-95">
                    ดูรายละเอียด
                  </button>
                </div>
              </div>
              {/* Swipe hint at bottom center */}
              <p className={`text-center text-[11px] text-gray-400 transition-all duration-300 ${drawerOpen ? 'opacity-0 h-0 overflow-hidden mt-0' : 'opacity-100 mt-1'}`}>
                ↑ ปัดขึ้นเพื่อจอง
              </p>

              <div className={`transition-all duration-300 ease-out ${drawerOpen ? 'max-h-[60vh] opacity-100 overflow-y-auto overflow-x-hidden' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="pb-3">
                  {renderContent(true)}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className={shouldUseDrawer ? 'hidden lg:block' : ''}>
        <div className="ui-surface rounded-[1.5rem] border border-gray-100 bg-white p-4 sm:p-5 sm:rounded-[1.75rem] lg:sticky lg:top-24">
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
