import { useEffect, useRef, useState, type RefObject } from 'react'
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
  const [isExpanded, setIsExpanded] = useState(false)
  const [viewState, setViewState] = useState<'idle' | 'exiting' | 'entering'>('idle')
  const [calendarMonthIndex, setCalendarMonthIndex] = useState(0)
  const monthScrollRef = useRef<HTMLDivElement>(null)

  const handleToggleView = () => {
    if (viewState !== 'idle') return
    setViewState('exiting')
    setTimeout(() => {
      setIsExpanded(prev => !prev)
      setViewState('entering')
      setTimeout(() => setViewState('idle'), 350)
    }, 200)
  }

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' })
    }
  }, [selectedMonth, scrollRef])

  useEffect(() => {
    if (!monthScrollRef.current) return
    const activeBtn = monthScrollRef.current.querySelector('[data-active-month="true"]') as HTMLElement | null
    if (activeBtn) {
      const container = monthScrollRef.current
      const scrollLeft = activeBtn.offsetLeft - container.clientWidth / 2 + activeBtn.clientWidth / 2
      container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' })
    }
  }, [selectedMonth])

  const scrollDates = (amount: number) => {
    scrollRef.current?.scrollBy({ left: amount, behavior: 'smooth' })
  }

  const handleMonthClick = (month: string) => {
    setSelectedMonth(month)
  }

  const showMonthPills = upcomingSchedules.length > 0 && availableMonths.length > 1

  return (
    <div className="mb-4 border-b border-gray-200 pb-4 sm:mb-5 sm:pb-5">
      <div className="mb-2.5 sm:mb-3 flex items-baseline justify-between">
        <label className="block text-base font-bold whitespace-nowrap text-slate-800 sm:text-lg">เลือกวันที่เดินทาง</label>
        {upcomingSchedules.length > 4 && (
          <button type="button" onClick={handleToggleView} className="text-xs font-semibold text-primary sm:text-lg hover:underline">
            {isExpanded ? 'ขอดูแบบแถบเลื่อน' : 'ขอดูแบบปฏิทิน'}
          </button>
        )}
      </div>

      {!isExpanded && showMonthPills && (
        <div className="relative mb-2.5 sm:mb-3">
          <div
            ref={monthScrollRef}
            className="scrollbar-hide flex gap-1.5 overflow-x-auto pb-1 scroll-smooth"
          >
            <button
              type="button"
              data-active-month={selectedMonth === 'all'}
              onClick={() => handleMonthClick('all')}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[14px] font-bold transition-all whitespace-nowrap sm:px-3 sm:py-1.5 sm:text-md ${selectedMonth === 'all'
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
              }`}
            >
              ทั้งหมด
            </button>
            {availableMonths.map((month) => {
              const isActive = selectedMonth === month
              const monthLabel = new Date(`${month}-01`).toLocaleString('th-TH', { month: 'short' })
              const yearLabel = (new Date(`${month}-01`).getFullYear() + 543).toString().slice(-2)
              return (
                <button
                  key={month}
                  type="button"
                  data-active-month={isActive}
                  onClick={() => handleMonthClick(month)}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[14px] font-bold transition-all whitespace-nowrap sm:px-3 sm:py-1.5 sm:text-md ${isActive
                    ? 'bg-[var(--color-primary)] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-700'
                  }`}
                >
                  {monthLabel} {yearLabel}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {upcomingSchedules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-3 py-3 text-center text-xs text-gray-400 sm:px-4 sm:py-4 sm:text-sm">
          ไม่มีรอบทัวร์ที่เปิดรับในขณะนี้
        </div>
      ) : (
        <>
          <div className={`flex ${isExpanded ? 'flex-col' : 'items-center gap-1.5'}`}>
            {!isExpanded && (canScrollLeft || canScrollRight) && (
              <ScrollerArrowButton direction="left" onClick={() => scrollDates(-220)} disabled={!canScrollLeft} className="h-8 w-8 shrink-0 text-primary disabled:text-gray-200" />
            )}
            <div className={`relative min-w-0 flex-1 overflow-hidden ${isExpanded ? '' : '-mx-4 px-4 sm:mx-0 sm:px-0'}`}>
              <div
                ref={scrollRef}
                className={`transform transition-all duration-300 ease-out ${
                  viewState === 'exiting' ? 'opacity-0 scale-95 blur-sm' : 
                  viewState === 'entering' ? 'opacity-100 scale-100 blur-0 animate-slide-up' : 
                  'opacity-100 scale-100 blur-0'
                } ${isExpanded 
                  ? "w-full overflow-y-auto max-h-[60vh] pr-2 scrollbar-hide" 
                  : "scrollbar-hide flex gap-2.5 overflow-x-auto pb-4 pt-2 scroll-smooth"
                }`}
                style={isExpanded ? {} : { scrollPaddingInline: '1rem' }}
              >
              {(() => {
                if (isExpanded) {
                  const safeIndex = Math.min(Math.max(0, calendarMonthIndex), Math.max(0, availableMonths.length - 1))
                  const monthStr = availableMonths.length > 0 ? availableMonths[safeIndex] : null

                  if (!monthStr) {
                    return <div className="w-full py-3 text-center text-sm text-gray-400">ไม่มีรอบทัวร์เปิดรับ</div>
                  }

                  const [year, month] = monthStr.split('-').map(Number)
                  const firstDay = new Date(year, month - 1, 1).getDay()
                  const daysInMonth = new Date(year, month, 0).getDate()
                  const monthName = new Date(year, month - 1, 1).toLocaleString('th-TH', { month: 'long', year: 'numeric' })
                  
                  const days = Array.from({ length: daysInMonth }, (_, i) => {
                    const dayNum = i + 1
                    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
                    const schedulesOnDate = upcomingSchedules.filter((s) => s.startDate === dateStr)
                    const isFullyBooked = schedulesOnDate.length > 0 && schedulesOnDate.every((s) => {
                      const seats = availableSeatsData[s.id] ?? (s.maxCapacity - s.currentBooked)
                      return Math.max(0, seats) <= 0
                    })
                    const isSelected = selectedSchedule?.startDate === dateStr
                    return { dayNum, dateStr, hasTour: schedulesOnDate.length > 0, isFullyBooked, isSelected }
                  })

                  const hasNext = safeIndex < availableMonths.length - 1
                  const hasPrev = safeIndex > 0

                  return (
                    <div className="flex w-full flex-col gap-5 pb-4">
                      <div className="w-full rounded-2xl border border-gray-100 bg-white p-3 sm:p-4 shadow-sm">
                        
                        <div className="mb-4 flex items-center justify-between px-2">
                          <button 
                            type="button" 
                            onClick={() => setCalendarMonthIndex(safeIndex - 1)} 
                            disabled={!hasPrev}
                            className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${hasPrev ? 'bg-gray-50 text-primary hover:bg-gray-100' : 'text-gray-200'}`}
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                          </button>
                          
                          <h3 className="text-sm font-extrabold text-gray-800">{monthName}</h3>
                          
                          <button 
                            type="button" 
                            onClick={() => setCalendarMonthIndex(safeIndex + 1)} 
                            disabled={!hasNext}
                            className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${hasNext ? 'bg-gray-50 text-primary hover:bg-gray-100' : 'text-gray-200'}`}
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                          </button>
                        </div>

                        <div className="mb-2 grid grid-cols-7 gap-1 text-center">
                          {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((d) => (
                            <div key={d} className="text-[11px] font-bold text-gray-400">{d}</div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                          {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                          {days.map(({ dayNum, dateStr, hasTour, isFullyBooked, isSelected }) => {
                            if (!hasTour) {
                              return (
                                <div key={dayNum} className="flex h-10 w-full items-center justify-center text-[13px] text-gray-300 opacity-50">
                                  {dayNum}
                                </div>
                              )
                            }
                            return (
                              <button
                                key={dayNum}
                                type="button"
                                disabled={isFullyBooked}
                                onClick={() => {
                                  const sched = upcomingSchedules.find(s => s.startDate === dateStr && (availableSeatsData[s.id] ?? (s.maxCapacity - s.currentBooked)) > 0)
                                  if (sched) setSelectedSchedule(sched)
                                }}
                                className={`relative flex h-10 w-full flex-col items-center justify-center rounded-xl transition-all sm:h-11 ${
                                  isSelected ? 'bg-primary text-white font-bold shadow-md shadow-primary/30 scale-105' :
                                  isFullyBooked ? 'bg-red-50 text-red-300 line-through' :
                                  'bg-slate-50 text-slate-800 hover:bg-primary/10 hover:text-primary font-bold'
                                }`}
                              >
                                <span className="text-[13px] sm:text-[14px]">{dayNum}</span>
                                {hasTour && !isFullyBooked && !isSelected && <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-emerald-500 shadow-sm" />}
                                {hasTour && isFullyBooked && !isSelected && <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-red-400 opacity-50" />}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                }

                let datesList = Array.from(new Set(upcomingSchedules.map((schedule: TourSchedule) => schedule.startDate))).sort()

                if (selectedMonth !== 'all') {
                  datesList = datesList.filter((date) => date.startsWith(selectedMonth))
                } else {
                  datesList = datesList.slice(0, 30)
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
                    className={`w-[calc(20%-0.5rem)] min-w-[66px] flex-shrink-0 flex flex-col items-center justify-center rounded-2xl border py-2.5 transition-all duration-300 sm:py-3 ${isSelected
                      ? 'border-primary/40 bg-blue-50 text-primary shadow-md shadow-primary/10 scale-[1.06]'
                      : isFullyBooked
                        ? 'cursor-not-allowed border-transparent bg-gray-50 text-gray-300'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm'
                      }`}
                  >
                    <span className={`text-[14px] font-bold uppercase tracking-widest ${isSelected ? 'text-primary/70' : 'text-gray-400'}`}>{weekday}</span>
                    <span className={`mt-0.5 block text-[1.25rem] font-black leading-none sm:text-[1.45rem] ${isSelected ? 'text-primary' : ''}`}>{day}</span>
                    <span className={`mt-0.5 block text-[14px] font-semibold ${isSelected ? 'text-primary/70' : 'text-gray-500'}`}>{month}</span>
                    <span className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[14px] font-bold ${isSelected ? 'bg-primary/0 text-primary' : isFullyBooked ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
                      {isFullyBooked ? 'เต็ม' : 'ว่าง'}
                    </span>
                  </button>
                ))
              })()}
              </div>
              {!isExpanded && canScrollLeft && <div className="ui-rail-fade-left absolute left-0 top-0 bottom-4 w-3 pointer-events-none" />}
              {!isExpanded && canScrollRight && <div className="ui-rail-fade-right absolute right-0 top-0 bottom-4 w-3 pointer-events-none" />}
            </div>
            {!isExpanded && (canScrollLeft || canScrollRight) && (
              <ScrollerArrowButton direction="right" onClick={() => scrollDates(220)} disabled={!canScrollRight} className="h-8 w-8 shrink-0 text-primary disabled:text-gray-200" />
            )}
          </div>

          {selectedSchedule && !tour.minPeople && (
            <div className="mt-4 sm:mt-5">
              {(() => {
                const schedulesOnSelectedDate = upcomingSchedules.filter((schedule: TourSchedule) => schedule.startDate === selectedSchedule.startDate)
                const hasMultipleRounds = schedulesOnSelectedDate.length > 1

                return (
                  <div className="space-y-2">
                    <label className="block text-base font-bold text-slate-800 sm:text-lg">
                      {hasMultipleRounds ? 'เลือกรอบเวลา (Join Trip)' : 'รายละเอียดรอบ / จำนวนที่นั่งว่าง (Join Trip)'}
                    </label>
                    <div className="grid gap-1.5 sm:gap-2">
                      {schedulesOnSelectedDate.map((schedule: TourSchedule) => {
                        const seatsLeft = Math.max(0, availableSeatsData[schedule.id] ?? (schedule.maxCapacity - schedule.currentBooked))
                        const isFull = seatsLeft <= 0
                        const isActiveRound = selectedSchedule.id === schedule.id
                        const capacityPercent = schedule.maxCapacity > 0 ? (seatsLeft / schedule.maxCapacity) * 100 : 0

                        return (
                          <button
                            key={schedule.id}
                            type="button"
                            disabled={isFull}
                            onClick={() => setSelectedSchedule(schedule)}
                            className={`w-full rounded-2xl border px-3 py-2.5 text-left transition-all duration-300 sm:px-4 sm:py-3 ${isActiveRound
                              ? 'border-primary/40 bg-blue-50 shadow-md shadow-gray-400/10 text-primary scale-[1.03]'
                              : isFull
                                ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-60'
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                              }`}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className={`flex h-6 w-6 items-center justify-center rounded-full border sm:h-6 sm:w-6 ${isActiveRound ? 'border-primary bg-primary' : 'border-gray-300 bg-white'}`}>
                                  {isActiveRound && <div className="h-3 w-3 rounded-full bg-white sm:h-3 sm:w-3" />}
                                </div>
                                <div>
                                  <p className={`text-sm font-bold sm:text-base ${isActiveRound ? 'text-primary' : 'text-gray-700'}`}>
                                    {schedule.timeSlot ? schedule.timeSlot : (hasMultipleRounds ? 'ไม่ระบุเวลา' : 'รอบออกเดินทาง')}
                                  </p>
                                  {schedule.roundName && (
                                    <p className={`text-[11px] sm:text-[13px] ${isActiveRound ? 'text-primary/70' : 'text-gray-500'}`}>{schedule.roundName}</p>
                                  )}
                                </div>
                              </div>
                              <span className={`rounded-full px-2 py-0.5 text-[15px] font-semibold sm:px-3 sm:py-1 sm:text-md ${isFull ? 'bg-red-50 text-red-500' : capacityPercent > 50 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
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
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:mt-4 sm:px-4 sm:py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold whitespace-nowrap text-slate-600 sm:text-sm">วันที่ท่านเลือก</span>
                <div className="flex items-center gap-2">
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center text-slate-400 sm:h-5 sm:w-5">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-slate-800 sm:text-sm">
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
