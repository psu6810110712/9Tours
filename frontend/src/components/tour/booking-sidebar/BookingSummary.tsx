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
    <div className="rounded-[1.25rem] border border-gray-100 bg-gray-50/90 p-3 sm:rounded-[1.5rem] sm:p-4">
      <div className="space-y-2 border-b border-gray-200 pb-3 sm:space-y-2.5 sm:pb-4">
        {tour.minPeople ? (
          <div className="flex items-center justify-between gap-2 text-[13px] sm:gap-3 sm:text-[15px]">
            <span className="font-medium text-gray-600">ราคาเหมาแบบส่วนตัว</span>
            <span className="whitespace-nowrap font-semibold text-gray-800">฿{Number(tour.price || 0).toLocaleString()}</span>
          </div>
        ) : (
          <>
            {adults > 0 && (
              <div className="flex items-start justify-between gap-2 text-[13px] sm:gap-3 sm:text-[15px]">
                <span className="font-medium text-gray-600">
                  ผู้ใหญ่ <span className="text-[11px] font-medium text-gray-400 sm:text-[13px]">(฿{Number(tour.price).toLocaleString()} x {adults})</span>
                </span>
                <span className="whitespace-nowrap font-semibold text-gray-800">
                  {((Number(tour.price || 1500) * adults).toLocaleString())} บาท
                </span>
              </div>
            )}
            {children > 0 && (
              <div className="flex items-start justify-between gap-2 text-[13px] sm:gap-3 sm:text-[15px]">
                <span className="font-medium text-gray-600">
                  เด็ก <span className="text-[11px] font-medium text-gray-400 sm:text-[13px]">(฿{Number(tour.childPrice || 1000).toLocaleString()} x {children})</span>
                </span>
                <span className="whitespace-nowrap font-semibold text-gray-800">
                  {((Number(tour.childPrice || 1000) * children).toLocaleString())} บาท
                </span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-2 pt-3 sm:pt-4">
        <span className="text-sm font-bold text-gray-900 sm:text-base">รวมทั้งหมด</span>
        <span className="text-xl font-bold leading-none text-accent sm:text-2xl">{totalPrice.toLocaleString()} บาท</span>
      </div>

      <button
        type="button"
        onClick={onBookingClick}
        disabled={isBookingDisabled}
        className={`ui-focus-ring ui-pressable mt-3 w-full rounded-2xl py-2.5 text-sm font-semibold sm:mt-4 sm:py-3 sm:text-base ${isBookingDisabled
          ? 'cursor-not-allowed bg-gray-200 text-gray-400 shadow-none hover:transform-none'
          : 'bg-primary text-white shadow-md hover:bg-primary-dark'
        }`}
      >
        {buttonText}
      </button>
    </div>
  )
}

