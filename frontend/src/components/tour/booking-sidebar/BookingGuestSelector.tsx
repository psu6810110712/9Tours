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
      <div className="mb-5 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-4">
        <label className="mb-2 block text-lg font-semibold text-amber-800">จำนวนผู้เดินทาง</label>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="text-[16px] font-medium text-amber-600">ทัวร์นี้เหมาะสำหรับ {tour.minPeople}–{tour.maxPeople || tour.minPeople} ท่าน</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <label className="text-lg font-bold text-gray-600">จำนวนผู้เดินทาง</label>
        {!hasSelectedSchedule && <span className="text-md text-amber-600">เลือกวันที่ก่อนเพื่อเลือกจำนวนคน</span>}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { label: 'ผู้ใหญ่', value: adults, min: 1, setValue: setAdults },
          { label: 'เด็ก', value: children, min: 0, setValue: setChildren },
        ].map(({ label, value, min, setValue }) => (
          <div key={label} className="rounded-[1.25rem] border border-gray-100 bg-gray-50 px-4 py-3">
            <label className="mb-3 block text-md font-semibold text-gray-500">{label}</label>
            <div className="flex items-center rounded-2xl border border-gray-200 bg-white">
              <button
                type="button"
                onClick={() => setValue(Math.max(min, value - 1))}
                className="ui-focus-ring flex h-11 w-11 items-center justify-center text-lg font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={value <= min}
              >
                −
              </button>
              <span className="flex-1 text-center text-base font-semibold text-gray-900">{value}</span>
              <button
                type="button"
                onClick={() => setValue(value + 1)}
                className="ui-focus-ring flex h-11 w-11 items-center justify-center text-lg font-semibold text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
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
