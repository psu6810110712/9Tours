import type { Tour } from '../../../types/tour'

interface BookingPriceHeaderProps {
  tour: Tour
  isDrawer?: boolean
}

export default function BookingPriceHeader({ tour, isDrawer = false }: BookingPriceHeaderProps) {
  const isPrivate = !!tour.minPeople
  const price = Number(tour.price || 0)
  const originalPrice = Number(tour.originalPrice || 0)
  const hasDiscount = originalPrice > price
  const discountPercent = hasDiscount
    ? Math.abs(Math.round((1 - price / originalPrice) * 100))
    : 0

  const containerClasses = isDrawer
    ? "relative mb-4 border-b border-gray-100 pb-4"
    : "relative -mx-4 -mt-4 mb-4 overflow-hidden rounded-t-[1.5rem] border-b border-gray-100 px-4 pb-4 pt-4 sm:-mx-5 sm:-mt-5 sm:mb-5 sm:rounded-t-[1.75rem] sm:px-5 sm:pb-5 sm:pt-5"

  const badgeClasses = isDrawer
    ? "absolute right-0 top-0 rounded-bl-[1.25rem] rounded-tr-[1rem] rounded-tl-[0.5rem] rounded-br-[0.5rem] bg-red-500 px-3 py-1.5 text-right text-white shadow-sm"
    : "absolute right-0 top-0 rounded-bl-[1.25rem] rounded-tr-[1.5rem] bg-red-500 px-3 py-1.5 text-right text-white shadow-sm sm:rounded-bl-[1.5rem] sm:rounded-tr-[1.75rem] sm:px-5 sm:py-2"

  return (
    <div className={containerClasses}>
      {hasDiscount && (
        <div className={badgeClasses}>
          {tour.discountEndDate && (
            <p className="mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.07em] text-white/75 sm:mt-2 sm:text-[1rem]">
              ถึง {new Date(tour.discountEndDate + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
            </p>
          )}
          {!tour.discountEndDate && <p className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-white/75"></p>}
          <p className="mt-0.5 text-xl font-black leading-none sm:text-2xl">{"\u0e25\u0e14 "}{discountPercent}%</p>
          <p className="mt-1 text-sm font-semibold text-white/80 line-through sm:mt-1.5 sm:text-lg">{originalPrice.toLocaleString()} บาท</p>
        </div>
      )}

      <div className={`flex items-start justify-between gap-2 sm:gap-3 ${hasDiscount ? 'pr-20 sm:pr-28' : ''}`}>
        <div>
          <p className="text-base font-semibold text-gray-500 sm:text-lg">{isPrivate ? "\u0e23\u0e32\u0e04\u0e32\u0e40\u0e2b\u0e21\u0e32\u0e2a\u0e48\u0e27\u0e19\u0e15\u0e31\u0e27" : "\u0e23\u0e32\u0e04\u0e32\u0e40\u0e23\u0e34\u0e48\u0e21\u0e15\u0e49\u0e19"}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[1.6rem] font-bold leading-none text-gray-900 sm:text-[2rem]">
              {price.toLocaleString()}
            </span>
            <span className="text-base font-medium text-gray-500 sm:text-lg">{isPrivate ? "\u0e1a\u0e32\u0e17" : "\u0e1a\u0e32\u0e17 / \u0e17\u0e48\u0e32\u0e19"}</span>
          </div>
          {tour.childPrice != null && !isPrivate && tour.childPrice !== tour.price && (
            <p className="mt-1.5 text-xs text-gray-500 sm:mt-2 sm:text-sm">{"\u0e23\u0e32\u0e04\u0e32\u0e40\u0e14\u0e47\u0e01 "} {Number(tour.childPrice).toLocaleString()} บาท{" / \u0e17\u0e48\u0e32\u0e19"}</p>
          )}
        </div>
      </div>
    </div>
  )
}
