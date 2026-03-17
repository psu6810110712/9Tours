import type { Tour } from '../../../types/tour'

interface BookingGuestSelectorProps {
  tour: Tour
  adults: number
  setAdults: (value: number) => void
  children: number
  setChildren: (value: number) => void
  isMaxReached: boolean
  hasSelectedSchedule: boolean
}

export default function BookingGuestSelector({
  tour,
  adults,
  setAdults,
  children,
  setChildren,
  isMaxReached,
  hasSelectedSchedule,
}: BookingGuestSelectorProps) {
  const isPrivate = !!tour.minPeople

  if (isPrivate) {
    return (
      <div className="mb-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-3 py-3 sm:mb-5 sm:rounded-[1.5rem] sm:px-4 sm:py-4">
        <label className="mb-2 block text-sm font-semibold text-slate-700 sm:text-md">จำนวนผู้เดินทาง</label>
        <div className="flex items-center gap-3">
          <div className="flex shrink-0 h-9 w-9 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 sm:h-10 sm:w-10">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-slate-900 sm:text-[15px]">
              เหมาะสำหรับ {tour.minPeople}–{tour.maxPeople || tour.minPeople} ท่าน
            </p>
            <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 sm:px-2.5 sm:py-1 sm:text-xs">
              ราคาเหมาจ่ายทั้งกลุ่ม
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-4 sm:mb-5">
      <div className="mb-3 sm:mb-4">
        <label className="block text-base font-bold text-slate-800 sm:text-lg">จำนวนผู้เดินทาง</label>
        {!hasSelectedSchedule && <p className="mt-1 text-xs text-amber-600">กรุณาเลือกวันที่ก่อนเพื่อเลือกจำนวนคน</p>}
      </div>

      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-3">
        {[
          { label: 'ผู้ใหญ่', hint: 'อายุ 12 ปีขึ้นไป', value: adults, min: 1, setValue: setAdults },
          { label: 'เด็ก', hint: 'อายุ 3–11 ปี', value: children, min: 0, setValue: setChildren },
        ].map(({ label, hint, value, min, setValue }) => (
          <div key={label} className="flex items-center justify-between gap-2 rounded-[1.15rem] border border-gray-100 bg-gray-50 px-3 py-2 sm:flex-col sm:items-stretch sm:gap-0 sm:rounded-[1.25rem] sm:px-4 sm:py-3">
            <div className="sm:mb-3">
              <label className="text-sm font-semibold text-slate-600 sm:block sm:text-md">{label}</label>
              <p className="text-[10px] text-slate-400 sm:text-[11px]">{hint}</p>
            </div>
            <div className="flex items-center rounded-2xl border border-gray-200 bg-white">
              <button
                type="button"
                onClick={() => setValue(Math.max(min, value - 1))}
                className="ui-focus-ring flex h-9 w-9 items-center justify-center text-base font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 sm:h-11 sm:w-11 sm:text-lg"
                disabled={value <= min}
              >
                −
              </button>
              <span className="min-w-[2.5rem] flex-1 text-center text-sm font-semibold text-gray-900 sm:text-base">{value}</span>
              <button
                type="button"
                onClick={() => setValue(value + 1)}
                className="ui-focus-ring flex h-9 w-9 items-center justify-center text-base font-semibold text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 sm:h-11 sm:w-11 sm:text-lg"
                disabled={isMaxReached || !hasSelectedSchedule}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
