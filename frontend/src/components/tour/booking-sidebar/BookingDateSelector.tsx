import { useEffect, useState, type RefObject } from 'react'
import ScrollerArrowButton from '../../common/ScrollerArrowButton'
import type { Tour, TourSchedule } from '../../../types/tour'

export function parseDate(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`)
  return {
    day: date.toLocaleString('th-TH', { day: '2-digit' }),
    month: date.toLocaleString('th-TH', { month: 'short' }),
    year: date.getFullYear().toString(),
    weekday: date.toLocaleString('th-TH', { weekday: 'short' }),
  }
}

interface BookingDateSelectorProps {
  tour: Tour
  upcomingSchedules: TourSchedule[]
  availableMonths: string[]
  selectedMonth: string
  setSelectedMonth: (month: string) => void
  selectedSchedule: TourSchedule | null
  setSelectedSchedule: (schedule: TourSchedule) => void
  scrollRef: RefObject<HTMLDivElement | null>
  availableSeatsData?: { [key: number]: number | null }
}

export default function BookingDateSelector({
  tour,
  upcomingSchedules,
  availableMonths,
  selectedMonth,
  setSelectedMonth,
  selectedSchedule,
  setSelectedSchedule,
  scrollRef,
  availableSeatsData = {},
}: BookingDateSelectorProps) {
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    const element = scrollRef.current
    if (!element) {
      setCanScrollLeft(false)
      setCanScrollRight(false)
      return
    }

    const updateScrollState = () => {
      setCanScrollLeft(element.scrollLeft > 8)
      setCanScrollRight(element.scrollLeft + element.clientWidth < element.scrollWidth - 8)
    }

    updateScrollState()
    element.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)

    return () => {
      element.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [scrollRef, upcomingSchedules, selectedMonth])

  const scrollDates = (amount: number) => {
    scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' })
  }

  return (
    <div className="mb-5 border-b border-gray-100 pb-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <label className="block text-sm font-semibold text-gray-700">เลือกวันที่เดินทาง</label>
          {(canScrollLeft || canScrollRight) && (
            <p className="mt-1 text-xs font-medium text-gray-400">เลื่อนดูวันเดินทางเพิ่มเติมได้</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(canScrollLeft || canScrollRight) && (
            <div className="hidden items-center gap-2 sm:flex">
              <ScrollerArrowButton direction="left" onClick={() => scrollDates(-220)} disabled={!canScrollLeft} className="h-10 w-10" />
              <ScrollerArrowButton direction="right" onClick={() => scrollDates(220)} disabled={!canScrollRight} className="h-10 w-10" />
            </div>
          )}
          {upcomingSchedules.length > 0 && availableMonths.length > 1 && (
            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="ui-focus-ring rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 outline-none focus:border-[var(--color-primary)] focus:bg-white"
            >
              <option value="all">ทุกช่วงเวลา</option>
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {new Date(`${month}-01`).toLocaleString('th-TH', { month: 'long', year: 'numeric' })}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {upcomingSchedules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-center text-sm text-gray-400">
          ไม่มีรอบทัวร์ที่เปิดรับในขณะนี้
        </div>
      ) : (
        <>
          <div className="relative">
            <div
              ref={scrollRef}
              className="scrollbar-hide flex gap-2 overflow-x-auto px-1 pb-1 scroll-smooth"
              style={{ scrollPaddingInline: '0.25rem' }}
            >
              {(() => {
                let datesList = Array.from(new Set(upcomingSchedules.map((schedule: TourSchedule) => schedule.startDate))).sort()

                if (selectedMonth !== 'all') {
                  datesList = datesList.filter((date) => date.startsWith(selectedMonth))
                }

                const resultList = datesList.map((dateStr: string) => {
                  const schedulesOnDate = upcomingSchedules.filter((schedule: TourSchedule) => schedule.startDate === dateStr)
                  const isFullyBooked = schedulesOnDate.every((schedule: TourSchedule) => {
                    const seats = availableSeatsData[schedule.id] ?? (schedule.maxCapacity - schedule.currentBooked)
                    return Math.max(0, seats) <= 0
                  })
                  const isSelected = selectedSchedule?.startDate === dateStr
                  const { day, month, weekday } = parseDate(dateStr)
                  return { dateStr, day, month, weekday, isFullyBooked, isSelected }
                })

                let fullyBookedCount = 0
                const finalDates = resultList.filter((item) => {
                  if (item.isFullyBooked) fullyBookedCount += 1
                  if (item.isFullyBooked && fullyBookedCount > 2) return false
                  return true
                })

                if (finalDates.length === 0) {
                  return <div className="w-full py-3 text-center text-sm text-gray-400">ไม่มีรอบทัวร์ในเดือนนี้</div>
                }

                return finalDates.map(({ dateStr, day, month, weekday, isFullyBooked, isSelected }) => (
                  <button
                    key={dateStr}
                    type="button"
                    disabled={isFullyBooked}
                    onClick={() => {
                      const firstAvailable = upcomingSchedules.find((schedule: TourSchedule) => {
                        const seats = availableSeatsData[schedule.id] ?? (schedule.maxCapacity - schedule.currentBooked)
                        return schedule.startDate === dateStr && Math.max(0, seats) > 0
                      })
                      if (firstAvailable) setSelectedSchedule(firstAvailable)
                    }}
                    className={`min-w-[72px] flex-shrink-0 rounded-[1.25rem] border px-3 py-3 text-center transition-all ${isSelected
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)] shadow-sm'
                      : isFullyBooked
                        ? 'cursor-not-allowed border-transparent bg-gray-50 text-gray-300'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-80">{weekday}</span>
                    <span className="mt-1 block text-xl font-bold leading-none">{day}</span>
                    <span className="mt-1 block text-[11px] font-medium opacity-80">{month}</span>
                    <span className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${isFullyBooked ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
                      {isFullyBooked ? 'เต็ม' : 'ว่าง'}
                    </span>
                  </button>
                ))
              })()}
            </div>

            {canScrollLeft && <div className="ui-rail-fade-left" />}
            {canScrollRight && <div className="ui-rail-fade-right" />}

            {(canScrollLeft || canScrollRight) && (
              <div className="mt-3 flex items-center justify-end gap-2 sm:hidden">
                <ScrollerArrowButton direction="left" onClick={() => scrollDates(-220)} disabled={!canScrollLeft} className="h-10 w-10" />
                <ScrollerArrowButton direction="right" onClick={() => scrollDates(220)} disabled={!canScrollRight} className="h-10 w-10" />
              </div>
            )}
          </div>

          {selectedSchedule && !tour.minPeople && (
            <div className="mt-5">
              {(() => {
                const schedulesOnSelectedDate = upcomingSchedules.filter((schedule: TourSchedule) => schedule.startDate === selectedSchedule.startDate)
                const hasMultipleRounds = schedulesOnSelectedDate.length > 1

                return (
                  <div className="space-y-2.5">
                    <label className="block text-sm font-semibold text-gray-700">
                      {hasMultipleRounds ? 'เลือกรอบเวลา (Join Trip)' : 'รายละเอียดรอบ / จำนวนที่นั่งว่าง (Join Trip)'}
                    </label>
                    <div className="grid gap-2">
                      {schedulesOnSelectedDate.map((schedule: TourSchedule) => {
                        const seatsLeft = Math.max(0, availableSeatsData[schedule.id] ?? (schedule.maxCapacity - schedule.currentBooked))
                        const isFull = seatsLeft <= 0
                        const isActiveRound = selectedSchedule.id === schedule.id

                        return (
                          <button
                            key={schedule.id}
                            type="button"
                            disabled={isFull}
                            onClick={() => setSelectedSchedule(schedule)}
                            className={`w-full rounded-[1.25rem] border px-4 py-3 text-left transition-all ${isActiveRound
                              ? 'border-amber-300 bg-amber-50'
                              : isFull
                                ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-60'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className={`flex h-5 w-5 items-center justify-center rounded-full border ${isActiveRound ? 'border-accent bg-accent' : 'border-gray-300 bg-white'}`}>
                                  {isActiveRound && <div className="h-2 w-2 rounded-full bg-white" />}
                                </div>
                                <div>
                                  <p className={`text-base font-bold ${isActiveRound ? 'text-gray-900' : 'text-gray-700'}`}>
                                    {schedule.timeSlot ? schedule.timeSlot : (hasMultipleRounds ? 'ไม่ระบุเวลา' : 'รอบออกเดินทาง')}
                                  </p>
                                  {schedule.roundName && (
                                    <p className="text-[13px] text-gray-500">{schedule.roundName}</p>
                                  )}
                                </div>
                              </div>
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isFull ? 'bg-red-50 text-red-500' : seatsLeft <= 5 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                {isFull ? 'เต็มแล้ว' : `เหลือ ${seatsLeft} ที่`}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {selectedSchedule && (tour.tourType === 'package' || !!tour.minPeople) && (
            <div className="mt-4 rounded-[1.25rem] border border-gray-100 bg-gray-50 px-4 py-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-2xl bg-blue-50 p-2 text-blue-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-[13px] font-medium text-gray-500">วันที่เดินทาง</p>
                  <p className="mt-1 text-base font-bold text-gray-900">
                    {(() => {
                      const start = parseDate(selectedSchedule.startDate)
                      let dateText = ''
                      let durationText = ''
                      if (selectedSchedule.startDate !== selectedSchedule.endDate) {
                        const end = parseDate(selectedSchedule.endDate)
                        if (start.month === end.month) {
                          dateText = `${start.day} – ${end.day} ${start.month} ${start.year}`
                        } else {
                          dateText = `${start.day} ${start.month} – ${end.day} ${end.month} ${start.year}`
                        }

                        const startDate = new Date(selectedSchedule.startDate)
                        const endDate = new Date(selectedSchedule.endDate)
                        const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1
                        if (diffDays > 1) {
                          durationText = ` (${diffDays} วัน ${diffDays - 1} คืน)`
                        }
                      } else {
                        dateText = `${start.day} ${start.month} ${start.year}`
                      }
                      return `${dateText}${durationText}`
                    })()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
