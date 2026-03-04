import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Tour, TourSchedule } from '../../types/tour'
import { useAuth } from '../../context/AuthContext'
import { tourService } from '../../services/tourService'
import LoginModal from '../LoginModal'

interface BookingSidebarProps {
  tour: Tour
}

import BookingPriceHeader from './booking-sidebar/BookingPriceHeader'
import BookingDateSelector from './booking-sidebar/BookingDateSelector'
import BookingGuestSelector from './booking-sidebar/BookingGuestSelector'
import BookingSummary from './booking-sidebar/BookingSummary'

export default function BookingSidebar({ tour }: BookingSidebarProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const today = new Date().toISOString().slice(0, 10)

  // กรองเฉพาะรอบในอนาคต เรียงตามวันที่
  const upcomingSchedules = useMemo(() =>
    tour?.schedules
      ? tour.schedules.filter((s: TourSchedule) => s.startDate >= today).sort((a: TourSchedule, b: TourSchedule) => a.startDate.localeCompare(b.startDate))
      : [],
    [tour?.schedules]
  )

  const [selectedSchedule, setSelectedSchedule] = useState<TourSchedule | null>(
    upcomingSchedules.find((s: TourSchedule) => s.maxCapacity - s.currentBooked > 0)
    ?? upcomingSchedules[0]
    ?? null
  )

  const [selectedMonth, setSelectedMonth] = useState<string>('all')

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    upcomingSchedules.forEach((s: TourSchedule) => {
      const parts = s.startDate.split('-');
      if (parts.length >= 2) months.add(`${parts[0]}-${parts[1]}`);
    });
    return Array.from(months).sort();
  }, [upcomingSchedules])

  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [availableSeatsData, setAvailableSeatsData] = useState<{ [key: number]: number | null }>({})
  const scrollRef = useRef<HTMLDivElement>(null)



  // ดึงข้อมูล available seats จาก API สำหรับทุก schedule (เพื่อให้ date selector แสดงสถานะล่าสุด)
  useEffect(() => {
    if (!tour?.id || upcomingSchedules.length === 0) return

    const fetchAllSeats = async () => {
      const results: { [key: number]: number | null } = {}
      await Promise.all(
        upcomingSchedules.map(async (s: TourSchedule) => {
          try {
            const data = await tourService.getAvailableSeats(tour.id, s.id)
            results[s.id] = Math.max(0, data.availableSeats)
          } catch {
            results[s.id] = Math.max(0, s.maxCapacity - s.currentBooked)
          }
        })
      )
      setAvailableSeatsData(results)
    }

    fetchAllSeats()
  }, [tour?.id, upcomingSchedules])

  // ใช้ available seats จาก API ถ้ามี มิฉะนั้นใช้จากข้อมูลเก่า
  const seatsLeft = selectedSchedule
    ? Math.max(0, availableSeatsData[selectedSchedule.id] ?? (selectedSchedule.maxCapacity - selectedSchedule.currentBooked))
    : 0
  const totalGuests = adults + children
  const isPrivate = !!tour?.minPeople
  const totalPrice = isPrivate
    ? Number(tour?.price || 0)
    : Number(tour?.price || 1500) * adults + Number(tour?.childPrice || 1000) * children

  // 1. Logic ล็อคปุ่ม + (ตรวจสอบว่าคนจองเกินที่ว่างหรือไม่)
  const isMaxReached = isPrivate
    ? (tour?.maxPeople ? totalGuests >= tour.maxPeople : false) // กรณี Private Tour เช็คจาก maxPeople
    : (totalGuests >= seatsLeft) // กรณี Join Trip เช็คจาก seatsLeft

  // 2. Logic ล็อคปุ่ม "จองเลย"
  const isSoldOut = selectedSchedule && seatsLeft <= 0
  const isExceedCapacity = !isPrivate && totalGuests > seatsLeft
  const isBookingDisabled = !upcomingSchedules.length || !selectedSchedule || isSoldOut || isExceedCapacity

  let buttonText = 'จองเลย'
  if (!upcomingSchedules.length || !selectedSchedule) buttonText = 'ไม่มีรอบเปิดรับ'
  else if (isSoldOut && isPrivate) buttonText = 'รอบนี้ถูกจองแล้ว'
  else if (isSoldOut) buttonText = 'รอบนี้เต็มแล้ว'
  else if (isExceedCapacity) buttonText = 'ที่นั่งไม่เพียงพอ'

  const handleBookingClick = () => {
    if (!user) {
      setShowLoginModal(true)
      return
    }

    // ส่ง id ของ schedule แทนที่จะมีแค่จำนวนคน เพื่อให้ Backend รู้ว่าจองรอบไหน
    const targetScheduleId = selectedSchedule ? selectedSchedule.id : '-'
    navigate(`/booking/${tour.id}?scheduleId=${targetScheduleId}&adults=${adults}&children=${children}`)
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-20">
        <BookingPriceHeader tour={tour} />

        <BookingDateSelector
          tour={tour}
          upcomingSchedules={upcomingSchedules}
          availableMonths={availableMonths}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedSchedule={selectedSchedule}
          setSelectedSchedule={setSelectedSchedule}
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