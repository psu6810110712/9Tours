import type { Tour } from '../../../types/tour'

interface BookingPriceHeaderProps {
  tour: Tour
}

export default function BookingPriceHeader({ tour }: BookingPriceHeaderProps) {
  const isPrivate = !!tour.minPeople

  return (
    <div className="mb-5 border-b border-gray-100 pb-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-500">{isPrivate ? 'ราคาเหมาส่วนตัว' : 'ราคาเริ่มต้นต่อท่าน'}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[2rem] font-bold leading-none text-gray-900">
              ฿{Number(tour.price).toLocaleString()}
            </span>
            <span className="text-sm font-medium text-gray-500">{isPrivate ? 'บาท / กรุ๊ป' : 'บาท / คน'}</span>
          </div>
          {tour.childPrice != null && !isPrivate && tour.childPrice !== tour.price && (
            <p className="mt-2 text-sm text-gray-500">ราคาเด็ก ฿{Number(tour.childPrice).toLocaleString()} / คน</p>
          )}
        </div>

        {tour.originalPrice && tour.originalPrice > tour.price && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-400">ส่วนลด</p>
            <p className="mt-1 text-sm font-bold text-red-600">
              -{Math.abs(Math.round((1 - Number(tour.price) / Number(tour.originalPrice)) * 100))}%
            </p>
            <p className="text-xs text-red-400 line-through">฿{Number(tour.originalPrice).toLocaleString()}</p>
          </div>
        )}
      </div>


    </div>
  )
}
