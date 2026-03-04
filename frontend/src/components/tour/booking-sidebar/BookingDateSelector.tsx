import type { Ref } from 'react';
import type { Tour, TourSchedule } from '../../../types/tour';

export function parseDate(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00');
    return {
        day: d.toLocaleString('th-TH', { day: '2-digit' }),
        month: d.toLocaleString('th-TH', { month: 'short' }),
        year: d.getFullYear().toString(),
        weekday: d.toLocaleString('th-TH', { weekday: 'short' }),
    };
}

interface BookingDateSelectorProps {
    tour: Tour;
    upcomingSchedules: TourSchedule[];
    availableMonths: string[];
    selectedMonth: string;
    setSelectedMonth: (month: string) => void;
    selectedSchedule: TourSchedule | null;
    setSelectedSchedule: (schedule: TourSchedule) => void;
    scrollRef: Ref<HTMLDivElement | null>;
    availableSeatsData?: { [key: number]: number | null };
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
    availableSeatsData = {}
}: BookingDateSelectorProps) {
    return (
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
                                const isFullyBooked = schedulesOnDate.every((s: TourSchedule) => {
                                    const seats = availableSeatsData[s.id] ?? (s.maxCapacity - s.currentBooked);
                                    return Math.max(0, seats) <= 0;
                                })
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
                                        const firstAvailable = upcomingSchedules.find((s: TourSchedule) => {
                                            const seats = availableSeatsData[s.id] ?? (s.maxCapacity - s.currentBooked);
                                            return s.startDate === dateStr && Math.max(0, seats) > 0;
                                        })
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

                    {/* 2. Round Selection / Seat Availability (For Join Trips) */}
                    {selectedSchedule && !tour.minPeople && (
                        <div className="mt-4">
                            {(() => {
                                const schedulesOnSelectedDate = upcomingSchedules.filter((s: TourSchedule) => s.startDate === selectedSchedule.startDate)
                                const hasMultipleRounds = schedulesOnSelectedDate.length > 1

                                return (
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-600 block">
                                            {hasMultipleRounds ? 'เลือกรอบเวลา (Join Trip)' : 'รายละเอียดรอบ / จำนวนที่นั่งว่าง (Join Trip)'}
                                        </label>
                                        <div className="grid gap-2">
                                            {schedulesOnSelectedDate.map((s: TourSchedule) => {
                                                const left = Math.max(0, availableSeatsData[s.id] ?? (s.maxCapacity - s.currentBooked))
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
                                                                    {s.timeSlot ? s.timeSlot : (hasMultipleRounds ? 'ไม่ระบุเวลา' : 'รอบออกเดินทาง')}
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
                            })()}
                        </div>
                    )}

                    {/* ข้อมูลสรุปของรอบที่เลือก (โชว์ถ้าเป็น Package ให้เห็นช่วงวัน หรือ Private ให้เห็น info) */}
                    {selectedSchedule && (tour.tourType === 'package' || !!tour.minPeople) && (
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
    );
}
