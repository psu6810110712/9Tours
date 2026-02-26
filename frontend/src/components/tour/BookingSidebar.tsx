import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Tour, TourSchedule } from '../../types/tour'
import { useAuth } from '../../context/AuthContext'
import LoginModal from '../LoginModal'

interface BookingSidebarProps {
  tour: Tour | any // Allow any temporarily to accommodate mixed typing
}

// แปลงวันที่ 'YYYY-MM-DD' → { day: '21', month: 'ก.พ.', year: '2026', weekday: 'ศ' }
function parseDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
  const thaiDays = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: thaiMonths[d.getMonth()],
    year: String(d.getFullYear()),
    weekday: thaiDays[d.getDay()],
  }
}

export default function BookingSidebar({ tour }: BookingSidebarProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const today = new Date().toISOString().slice(0, 10)

  // กรองเฉพาะรอบในอนาคต เรียงตามวันที่
  const upcomingSchedules = useMemo(() =>
    tour?.schedules
      ? tour.schedules.filter((s: any) => s.startDate >= today).sort((a: any, b: any) => a.startDate.localeCompare(b.startDate))
      : [],
    [tour?.schedules]
  )

  const [selectedSchedule, setSelectedSchedule] = useState<TourSchedule | null>(
    upcomingSchedules.find((s: any) => s.maxCapacity - s.currentBooked > 0)
    ?? upcomingSchedules[0]
    ?? null
  )
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const seatsLeft = selectedSchedule
    ? selectedSchedule.maxCapacity - selectedSchedule.currentBooked
    : 0
  const totalGuests = adults + children
  const totalPrice = Number(tour?.price || 1500) * adults + Number(tour?.childPrice || 1000) * children

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
            <span className="text-base font-medium text-gray-500">บาท / คน</span>
          </div>
        </div>

        {/* เลือกวันที่ — date card ribbon */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-gray-600 mb-2 block">เลือกวันที่เดินทาง</label>

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
                  const uniqueDates = Array.from(new Set(upcomingSchedules.map((s: any) => s.startDate)))
                    .sort()
                    .map((dateStr: any) => {
                      // Find *any* schedule for this date to check availability
                      const schedulesOnDate = upcomingSchedules.filter((s: any) => s.startDate === dateStr)
                      const isFullyBooked = schedulesOnDate.every((s: any) => s.maxCapacity - s.currentBooked <= 0)
                      const isSelected = selectedSchedule?.startDate === dateStr
                      const { day, month, weekday } = parseDate(dateStr)

                      return { dateStr, day, month, weekday, isFullyBooked, isSelected }
                    })

                  return uniqueDates.map(({ dateStr, day, month, weekday, isFullyBooked, isSelected }) => (
                    <button
                      key={dateStr}
                      disabled={isFullyBooked}
                      onClick={() => {
                        // When date is clicked, auto-select the first available round for that date
                        const firstAvailable = upcomingSchedules.find((s: any) => s.startDate === dateStr && s.maxCapacity - s.currentBooked > 0)
                        if (firstAvailable) setSelectedSchedule(firstAvailable)
                      }}
                      className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border text-center transition-all duration-150 min-w-[56px]
                                ${isSelected
                          ? 'bg-[#F5A623] border-[#F5A623] text-white shadow-sm'
                          : isFullyBooked
                            ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-[#F5A623] hover:text-[#F5A623]'
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
                    const schedulesOnSelectedDate = upcomingSchedules.filter((s: any) => s.startDate === selectedSchedule.startDate)
                    const hasMultipleRounds = schedulesOnSelectedDate.length > 1

                    // ถ้ามีหลายรอบ หรือเป็นทัวร์ที่มี TimeSlot ให้แสดงรายการรอบ
                    if (hasMultipleRounds || selectedSchedule.timeSlot) {
                      return (
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-600 block">เลือกรอบเวลา (Join Trip)</label>
                          <div className="grid gap-2">
                            {schedulesOnSelectedDate.map((s: any) => {
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
                                      ? 'border-[#F5A623] bg-orange-50 ring-1 ring-[#F5A623]'
                                      : isFull
                                        ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                  <div>
                                    <div className={`text-sm font-bold ${isActiveRound ? 'text-gray-900' : 'text-gray-700'}`}>
                                      {s.timeSlot ? s.timeSlot : 'ไม่ระบุเวลา'}
                                    </div>
                                    {s.roundName && (
                                      <div className="text-xs text-gray-500">{s.roundName}</div>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    {isFull ? (
                                      <span className="text-xs font-bold text-red-400">เต็มแล้ว</span>
                                    ) : (
                                      <span className={`text-xs font-medium ${left <= 5 ? 'text-red-500' : 'text-green-600'}`}>
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

              {/* ข้อมูลสรุปของรอบที่เลือก */}
              {selectedSchedule && (
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
                      <p className="text-xs text-gray-500 font-medium mb-0.5">วันที่เดินทาง</p>
                      <p className="text-sm font-bold text-gray-900">
                        {(() => {
                          const start = parseDate(selectedSchedule.startDate)
                          if (selectedSchedule.startDate !== selectedSchedule.endDate) {
                            const end = parseDate(selectedSchedule.endDate)
                            const startMonth = start.month
                            const endMonth = end.month
                            const year = start.year

                            // กรณีเดือนเดียวกัน: 24-26 ก.พ. 2026
                            if (startMonth === endMonth) {
                              return `${start.day} – ${end.day} ${startMonth} ${year}`
                            }
                            // กรณีคนละเดือน: 28 ก.พ. – 2 มี.ค. 2026
                            return `${start.day} ${startMonth} – ${end.day} ${endMonth} ${year}`
                          }
                          return `${start.day} ${start.month} ${start.year}`
                        })()}
                      </p>
                      {/* แสดงชื่อรอบ หรือ ระยะเวลาแพ็กเกจ */}
                      {(selectedSchedule.roundName || selectedSchedule.timeSlot) && !tour.minPeople && (
                        <p className="text-xs text-gray-500 mt-0.5 font-medium">
                          {selectedSchedule.roundName}
                          {selectedSchedule.timeSlot && ` · ${selectedSchedule.timeSlot}`}
                        </p>
                      )}
                      {/* กรณี Private Package */}
                      {tour.minPeople && (
                        <p className="text-xs text-blue-600 mt-0.5 font-bold bg-blue-50 px-2 py-0.5 rounded-md inline-block">
                          Private Trip (เริ่ม {selectedSchedule.startDate})
                        </p>
                      )}
                    </div>
                  </div>

                  {/* จำนวนที่เหลือ + progress bar (ซ่อนถ้าเป็น Private เพราะมันเหมา) */}
                  {!tour.minPeople && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-500">สถานะที่นั่ง</span>
                        <span className={`text-xs font-bold ${seatsLeft <= 5 ? 'text-red-500' : 'text-green-600'}`}>
                          ว่าง {seatsLeft} ท่าน
                        </span>
                      </div>
                      {/* progress bar — แสดงสัดส่วนที่นั่งที่เหลือ (เขียว=เหลือเยอะ, แดง=ใกล้เต็ม) */}
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${seatsLeft <= 5 ? 'bg-red-400' : 'bg-green-500'}`}
                          style={{ width: `${(seatsLeft / selectedSchedule.maxCapacity) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* จำนวนคน */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-gray-600 mb-1.5 block">จำนวนผู้เดินทาง</label>
          {tour.minPeople && (
            <div className="mb-2 p-2 bg-blue-50 text-blue-700 text-xs rounded-lg border border-blue-100 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>แพ็กเกจนี้ต้องจองขั้นต่ำ {tour.minPeople} ท่าน</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
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
                  <button
                    onClick={() => set(Math.max(min, value - 1))}
                    className="px-3 py-2 text-gray-500 hover:bg-gray-50 font-semibold disabled:opacity-50"
                    disabled={value <= min}
                  >
                    -
                  </button>
                  <span className="flex-1 text-center text-base font-semibold text-gray-900">{value}</span>
                  <button
                    onClick={() => set(value + 1)}
                    className="px-3 py-2 text-gray-500 hover:bg-gray-50 font-semibold"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ราคารวม */}
        <div className="border-t border-gray-100 pt-4 mb-4">
          <div className="flex justify-between text-sm font-medium text-gray-500 mb-1.5">
            <span>฿{Number(tour.price).toLocaleString()} x {totalGuests} คน</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 text-base">
            <span>รวมทั้งหมด</span>
            <span className="text-[#F5A623]">฿{totalPrice.toLocaleString()}</span>
          </div>
        </div>

        {/* ปุ่มจอง */}
        <button
          onClick={handleBookingClick}
          disabled={!upcomingSchedules.length}
          className={`w-full font-semibold py-3 rounded-xl transition text-base 
            ${!upcomingSchedules.length
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-[#F5A623] text-white hover:bg-orange-500 shadow-md'
            }`}
        >
          {upcomingSchedules.length ? 'จองเลย' : 'ไม่มีรอบเปิดรับ'}
        </button>
      </div>

      {/* ควบคุม Login Modal */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSwitchToRegister={() => {
            setShowLoginModal(false)
            navigate('/') // หรือหน้า register 
          }}
        />
      )}
    </>
  )
}