import type { Tour } from '../../../types/tour'

interface BookingPriceHeaderProps {
  tour: Tour
}

export default function BookingPriceHeader({ tour }: BookingPriceHeaderProps) {
  const isPrivate = !!tour.minPeople
  const price = Number(tour.price || 0)
  const originalPrice = Number(tour.originalPrice || 0)
  const hasDiscount = originalPrice > price
  const discountPercent = hasDiscount
    ? Math.abs(Math.round((1 - price / originalPrice) * 100))
    : 0

  return (
    <div className="relative -mx-5 -mt-5 mb-5 overflow-hidden rounded-t-[1.75rem] border-b border-gray-100 px-5 pb-5 pt-5">
      {hasDiscount && (
        <div className="absolute right-0 top-0 rounded-bl-[1.5rem] rounded-tr-[1.75rem] bg-red-500 px-5 py-2 text-right text-white shadow-sm">
          <p className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-white/75"></p>
          <p className="mt-0.5 text-2xl font-black leading-none">{"\u0e25\u0e14 "}{discountPercent}%</p>
          <p className="mt-1.5 text-md text-lg font-semibold text-white/80 line-through">{originalPrice.toLocaleString()} บาท</p>
        </div>
      )}

      <div className={`flex items-start justify-between gap-3 ${hasDiscount ? 'pr-28' : ''}`}>
        <div>
          <p className="text-lg font-semibold text-gray-500">{isPrivate ? "\u0e23\u0e32\u0e04\u0e32\u0e40\u0e2b\u0e21\u0e32\u0e2a\u0e48\u0e27\u0e19\u0e15\u0e31\u0e27" : "\u0e23\u0e32\u0e04\u0e32\u0e40\u0e23\u0e34\u0e48\u0e21\u0e15\u0e49\u0e19"}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[2rem] font-bold leading-none text-gray-900">
              {price.toLocaleString()}
            </span>
            <span className="text-lg font-medium text-gray-500">{isPrivate ? "\u0e1a\u0e32\u0e17" : "\u0e1a\u0e32\u0e17 / \u0e17\u0e48\u0e32\u0e19"}</span>
          </div>
          {tour.childPrice != null && !isPrivate && tour.childPrice !== tour.price && (
            <p className="mt-2 text-sm text-gray-500">{"\u0e23\u0e32\u0e04\u0e32\u0e40\u0e14\u0e47\u0e01 "} {Number(tour.childPrice).toLocaleString()} บาท{" / \u0e17\u0e48\u0e32\u0e19"}</p>
          )}
        </div>
      </div>
    </div>
  )
}
