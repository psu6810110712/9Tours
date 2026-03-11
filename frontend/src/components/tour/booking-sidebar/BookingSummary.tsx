import type { Tour } from '../../../types/tour'

interface BookingSummaryProps {
  tour: Tour
  adults: number
  children: number
  totalPrice: number
  isBookingDisabled: boolean
  buttonText: string
  onBookingClick: () => void
}

export default function BookingSummary({
  tour,
  adults,
  children,
  totalPrice,
  isBookingDisabled,
  buttonText,
  onBookingClick,
}: BookingSummaryProps) {
  return (
    <div className="rounded-[1.5rem] border border-gray-100 bg-gray-50/90 p-4">
      <div className="space-y-2.5 border-b border-gray-200 pb-4">
        {tour.minPeople ? (
          <div className="flex items-center justify-between gap-3 text-[15px]">
            <span className="font-medium text-gray-600">ราคาเหมาแบบส่วนตัว</span>
            <span className="whitespace-nowrap font-semibold text-gray-800">฿{Number(tour.price || 0).toLocaleString()}</span>
          </div>
        ) : (
          <>
            {adults > 0 && (
              <div className="flex items-start justify-between gap-3 text-[15px]">
                <span className="font-medium text-gray-600">
                  ผู้ใหญ่ <span className="text-[13px] font-medium text-gray-400">(฿{Number(tour.price).toLocaleString()} x {adults})</span>
                </span>
                <span className="whitespace-nowrap font-semibold text-gray-800">
                  {((Number(tour.price || 1500) * adults).toLocaleString())} บาท
                </span>
              </div>
            )}
            {children > 0 && (
              <div className="flex items-start justify-between gap-3 text-[15px]">
                <span className="font-medium text-gray-600">
                  เด็ก <span className="text-[13px] font-medium text-gray-400">(฿{Number(tour.childPrice || 1000).toLocaleString()} x {children})</span>
                </span>
                <span className="whitespace-nowrap font-semibold text-gray-800">
                  {((Number(tour.childPrice || 1000) * children).toLocaleString())} บาท
                </span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex items-end justify-between gap-3 pt-4">
        <span className="text-base font-bold text-gray-900">รวมทั้งหมด</span>
        <span className="text-[1.75rem] font-bold leading-none text-accent">{totalPrice.toLocaleString()} บาท</span>
      </div>

      <button
        type="button"
        onClick={onBookingClick}
        disabled={isBookingDisabled}
        className={`ui-focus-ring ui-pressable mt-4 w-full rounded-2xl py-3 text-base font-semibold ${isBookingDisabled
          ? 'cursor-not-allowed bg-gray-200 text-gray-400 shadow-none hover:transform-none'
          : 'bg-accent text-white shadow-md hover:bg-orange-500'
        }`}
      >
        {buttonText}
      </button>
    </div>
  )
}

