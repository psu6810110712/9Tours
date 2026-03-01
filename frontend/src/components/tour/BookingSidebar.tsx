import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Tour, TourSchedule } from '../../types/tour'
import { useAuth } from '../../context/AuthContext'
import LoginModal from '../LoginModal'

interface BookingSidebarProps {
  tour: Tour
}

// แปลงวันที่ 'YYYY-MM-DD' → { day: '21', month: 'ก.พ.', year: '2026', weekday: 'ศ' }
function parseDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return {
    day: d.toLocaleString('th-TH', { day: '2-digit' }),
    month: d.toLocaleString('th-TH', { month: 'short' }),
    year: d.getFullYear().toString(),
    weekday: d.toLocaleString('th-TH', { weekday: 'short' }),
  };
}

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
  const scrollRef = useRef<HTMLDivElement>(null)

  const seatsLeft = selectedSchedule
    ? selectedSchedule.maxCapacity - selectedSchedule.currentBooked
    : 0
  const totalGuests = adults + children
  const totalPrice = Number(tour?.price || 1500) * adults + Number(tour?.childPrice || 1000) * children

  // 🔴 1. Logic ล็อคปุ่ม + (ตรวจสอบว่าคนจองเกินที่ว่างหรือไม่)
  const isMaxReached = tour?.minPeople
    ? (tour?.maxPeople ? totalGuests >= tour.maxPeople : false) // กรณี Private Tour เช็คจาก maxPeople
    : (totalGuests >= seatsLeft) // กรณี Join Trip เช็คจาก seatsLeft

  // 🔴 2. Logic ล็อคปุ่ม "จองเลย"
  const isSoldOut = !tour?.minPeople && selectedSchedule && seatsLeft <= 0
  const isExceedCapacity = !tour?.minPeople && totalGuests > seatsLeft
  const isBookingDisabled = !upcomingSchedules.length || !selectedSchedule || isSoldOut || isExceedCapacity

  let buttonText = 'จองเลย'
  if (!upcomingSchedules.length || !selectedSchedule) buttonText = 'ไม่มีรอบเปิดรับ'
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
        {/* ราคา */}
        <div className="mb-4">
          {tour.minPeople && (
            <div className="text-[13px] font-bold text-amber-600 mb-1.5 flex items-center gap-1.5">
              <span></span>Private Trip (ส่วนตัวเฉพาะกลุ่มคุณ)
            </div>
          )}
          {tour.originalPrice && (
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-medium text-gray-400 line-through">
                ฿{Number(tour.originalPrice).toLocaleString()}
              </p>
              {/* badge ส่วนลด */}
              <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
                -{Math.round((1 - Number(tour.price) / Number(tour.originalPrice)) * 100)}%
              </span>
            </div>
          )}
          <div className="flex items-baseline gap-1.5">
            <span className="text-[32px] leading-none font-bold text-[#111827]">
              ฿{Number(tour.price).toLocaleString()}
            </span>
            <span className="text-base font-medium text-gray-600">บาท / คน</span>
          </div>
        </div>

        {/* เลือกวันที่ — date card ribbon */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-gray-600 block">เลือกวันที่เดินทาง</label>
            {upcomingSchedules.length > 0 && availableMonths.length > 1 && (
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg py-1 px-2 outline-none focus:border-accent"
              >
                <option value="all">ทุกช่วงเวลา</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>
                    {new Date(m + "-01").toLocaleString('th-TH', { month: 'long', year: 'numeric' })}
                  </option>
                ))}
              </select>
            )}
          </div>

          {upcomingSchedules.length === 0 ? (
            <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-400 text-center">
              ไม่มีรอบทัวร์ที่เปิดรับในขณะนี้
            </div>
          ) : (
            <>
              {/* 1. Date Ribbon (Group by Date) */}
              <div
                ref={scrollRef}
                className="flex gap-2 overflow-x-auto pb-1"
                style={{ scrollbarWidth: 'none' }}
              >
                {(() => {
                  // Group schedules by date to show unique dates
                  let datesList = Array.from(new Set(upcomingSchedules.map((s: TourSchedule) => s.startDate))).sort()

                  // 1. กรองตามเดือนที่เลือก
                  if (selectedMonth !== 'all') {
                    datesList = datesList.filter((d: string) => d.startsWith(selectedMonth));
                  }

                  const resultList = datesList.map((dateStr: string) => {
                    // Find *any* schedule for this date to check availability
                    const schedulesOnDate = upcomingSchedules.filter((s: TourSchedule) => s.startDate === dateStr)
                    const isFullyBooked = schedulesOnDate.every((s: TourSchedule) => s.maxCapacity - s.currentBooked <= 0)
                    const isSelected = selectedSchedule?.startDate === dateStr
                    const { day, month, weekday } = parseDate(dateStr)

                    return { dateStr, day, month, weekday, isFullyBooked, isSelected }
                  })

                  // 2. Logic ตัวกรองลดขยะ: วันแบบ FullyBooked เอาแค่ 2 อันแรกสุด (FOMO)
                  let fullyBookedCount = 0;
                  const finalDates = resultList.filter(item => {
                    if (item.isFullyBooked) fullyBookedCount++;
                    if (item.isFullyBooked && fullyBookedCount > 2) return false;
                    return true;
                  });

                  if (finalDates.length === 0) {
                    return <div className="text-sm text-gray-400 py-2 w-full text-center">ไม่มีรอบทัวร์ในเดือนนี้</div>
                  }

                  return finalDates.map(({ dateStr, day, month, weekday, isFullyBooked, isSelected }) => (
                    <button
                      key={dateStr}
                      disabled={isFullyBooked}
                      onClick={() => {
                        // When date is clicked, auto-select the first available round for that date
                        const firstAvailable = upcomingSchedules.find((s: TourSchedule) => s.startDate === dateStr && s.maxCapacity - s.currentBooked > 0)
                        if (firstAvailable) setSelectedSchedule(firstAvailable)
                      }}
                      className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border text-center transition-all duration-150 min-w-[56px]
                                ${isSelected
                          ? 'bg-accent border-accent text-white shadow-md'
                          : isFullyBooked
                            ? 'bg-transparent border-transparent text-gray-300 cursor-not-allowed'
                            : 'bg-transparent border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                        }`}
                    >
                      <span className="text-[10px] font-medium opacity-80">{weekday}</span>
                      <span className="text-lg font-bold leading-tight">{day}</span>
                      <span className="text-[10px] font-medium opacity-80">{month}</span>
                      {isFullyBooked && (
                        <span className="text-[9px] text-red-400 mt-0.5">เต็ม</span>
                      )}
                    </button>
                  ))
                })()}
              </div>

              {/* 2. Round Selection (If selected date has multiple rounds AND NOT Private Package) */}
              {selectedSchedule && !tour.minPeople && (
                <div className="mt-4">
                  {(() => {
                    const schedulesOnSelectedDate = upcomingSchedules.filter((s: TourSchedule) => s.startDate === selectedSchedule.startDate)
                    const hasMultipleRounds = schedulesOnSelectedDate.length > 1

                    // ถ้ามีหลายรอบ หรือเป็นทัวร์ที่มี TimeSlot ให้แสดงรายการรอบ
                    if (hasMultipleRounds || selectedSchedule.timeSlot) {
                      return (
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-600 block">เลือกรอบเวลา (Join Trip)</label>
                          <div className="grid gap-2">
                            {schedulesOnSelectedDate.map((s: TourSchedule) => {
                              const left = s.maxCapacity - s.currentBooked
                              const isFull = left <= 0
                              const isActiveRound = selectedSchedule.id === s.id

                              return (
                                <button
                                  key={s.id}
                                  disabled={isFull}
                                  onClick={() => setSelectedSchedule(s)}
                                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group
                                    ${isActiveRound
                                      ? 'border-orange-200 bg-orange-50'
                                      : isFull
                                        ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                    }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-4 h-4 rounded-full border flex flex-shrink-0 items-center justify-center
                                      ${isActiveRound ? 'border-accent bg-accent' : 'border-gray-300 bg-white'}`}
                                    >
                                      {isActiveRound && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                    <div>
                                      <div className={`text-base font-bold ${isActiveRound ? 'text-gray-900' : 'text-gray-700'}`}>
                                        {s.timeSlot ? s.timeSlot : 'ไม่ระบุเวลา'}
                                      </div>
                                      {s.roundName && (
                                        <div className="text-[13px] text-gray-500">{s.roundName}</div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    {isFull ? (
                                      <span className="text-[13.5px] font-bold text-red-500">เต็มแล้ว</span>
                                    ) : (
                                      <span className={`text-[13.5px] font-medium ${left <= 5 ? 'text-red-500' : 'text-green-600'}`}>
                                        เหลือ {left} ที่
                                      </span>
                                    )}
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    }
                    return null
                  })()}
                </div>
              )}

              {/* ข้อมูลสรุปของรอบที่เลือก (ซ่อนถ้าเป็น Join Trip => เพราะ !tour.minPeople คือ Join Trip) */}
              {selectedSchedule && tour.minPeople && (
                <div className="mt-3 bg-gray-50 rounded-xl p-3.5 space-y-2.5 border border-gray-100">
                  {/* วันที่ + ชื่อรอบ/แพ็กเกจ */}
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-50 p-2 rounded-lg text-blue-600 mt-1">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[13px] text-gray-500 font-medium mb-0.5">วันที่เดินทาง</p>
                      <p className="text-base font-bold text-gray-900">
                        {(() => {
                          const start = parseDate(selectedSchedule.startDate)
                          let dateText = ''
                          let durationText = ''
                          if (selectedSchedule.startDate !== selectedSchedule.endDate) {
                            const end = parseDate(selectedSchedule.endDate)
                            const startMonth = start.month
                            const endMonth = end.month
                            const year = start.year

                            if (startMonth === endMonth) {
                              dateText = `${start.day} – ${end.day} ${startMonth} ${year}`
                            } else {
                              dateText = `${start.day} ${startMonth} – ${end.day} ${endMonth} ${year}`
                            }

                            const d1 = new Date(selectedSchedule.startDate)
                            const d2 = new Date(selectedSchedule.endDate)
                            const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24)) + 1
                            if (diffDays > 1) {
                              durationText = ` (${diffDays} วัน ${diffDays - 1} คืน)`
                            }
                          } else {
                            dateText = `${start.day} ${start.month} ${start.year}`
                          }
                          return dateText + durationText
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* จำนวนคน */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-gray-600 mb-0 block">
            จำนวนผู้เดินทาง
            {tour.minPeople && (
              <span className="block text-[11.5px] font-normal text-gray-500 mt-0.5 mb-2.5">
                *แพ็กเกจไพรเวท ต้องจองขั้นต่ำ {tour.minPeople} ท่านขึ้นไป
              </span>
            )}
          </label>
          <div className={`grid grid-cols-2 gap-3 ${!tour.minPeople ? 'mt-3' : ''}`}>
            {[
              {
                label: 'ผู้ใหญ่',
                value: adults,
                min: tour.minPeople ? Math.max(1, tour.minPeople) : 1,
                set: setAdults
              },
              { label: 'เด็ก', value: children, min: 0, set: setChildren },
            ].map(({ label, value, min, set }) => (
              <div key={label}>
                <label className="text-sm font-medium text-gray-500 mb-1 block">{label}</label>
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  {/* ปุ่ม - */}
                  <button
                    onClick={() => set(Math.max(min, value - 1))}
                    className="px-3 py-2 text-gray-500 hover:bg-gray-50 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={value <= min}
                  >
                    -
                  </button>
                  <span className="flex-1 text-center text-base font-semibold text-gray-900">{value}</span>
                  {/* 🔴 ปุ่ม + (ใส่ isMaxReached เพื่อล็อคเมื่อคนเต็ม) */}
                  <button
                    onClick={() => set(value + 1)}
                    className="px-3 py-2 text-gray-500 hover:bg-gray-50 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isMaxReached || !selectedSchedule}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ราคารวม */}
        <div className="border-t border-gray-100 pt-4 mb-4 space-y-2">
          {adults > 0 && (
            <div className="flex justify-between items-center text-[15px]">
              <span className="text-gray-600 font-medium">
                ผู้ใหญ่ <span className="text-gray-400 text-[13px] font-normal">(฿{Number(tour.price).toLocaleString()} x {adults})</span>
              </span>
              <span className="text-gray-700 font-medium whitespace-nowrap">
                ฿{(Number(tour.price || 1500) * adults).toLocaleString()}
              </span>
            </div>
          )}
          {children > 0 && (
            <div className="flex justify-between items-center text-[15px]">
              <span className="text-gray-600 font-medium">
                เด็ก <span className="text-gray-400 text-[13px] font-normal">(฿{Number(tour.childPrice || 1000).toLocaleString()} x {children})</span>
              </span>
              <span className="text-gray-700 font-medium whitespace-nowrap">
                ฿{(Number(tour.childPrice || 1000) * children).toLocaleString()}
              </span>
            </div>
          )}

          <div className="flex justify-between items-end pt-1">
            <span className="font-bold text-gray-900 text-base pb-0.5">รวมทั้งหมด</span>
            <span className="font-bold text-accent text-[22px] leading-none">฿{totalPrice.toLocaleString()}</span>
          </div>
        </div>

        {/* 🔴 ปุ่มจอง (เปลี่ยนสถานะและข้อความอัตโนมัติตาม Logic ที่เขียนไว้ด้านบน) */}
        <button
          onClick={handleBookingClick}
          disabled={isBookingDisabled}
          className={`w-full font-semibold py-3 rounded-xl transition-all text-base 
            ${isBookingDisabled
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              : 'bg-accent text-white hover:bg-orange-500 shadow-md active:scale-[0.98]'
            }`}
        >
          {buttonText}
        </button>
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