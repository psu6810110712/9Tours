import { Link } from 'react-router-dom'
import type { Tour } from '../types/tour'

interface TourCardProps {
  tour: Tour
}

// SVG icons
function ClockIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 7v5l3 3" />
    </svg>
  )
}

function LocationIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

export default function TourCard({ tour }: TourCardProps) {
  const originalPrice = tour.originalPrice
  const hasDiscount = originalPrice && originalPrice > tour.price
  const discountPercent = hasDiscount
    ? Math.round((1 - tour.price / originalPrice) * 100)
    : null

  const coverImage = tour.images[0] || 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=400'

  return (
    <Link to={`/tours/${tour.id}`} className="group block bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* รูปภาพ */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={coverImage}
          alt={tour.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* badge ส่วนลด */}
        {discountPercent && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{discountPercent}%
          </span>
        )}
        {/* badge ประเภท */}
        <span className="absolute top-2 left-2 bg-black/50 text-white text-xs font-medium px-2 py-1 rounded-full">
          {tour.tourType === 'one_day' ? 'วันเดย์ทริป' : 'แพ็คเกจ'}
        </span>
      </div>

      {/* เนื้อหา */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 text-base truncate mb-1">{tour.name}</h3>

        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500 mb-2">
          <LocationIcon />
          <span>{tour.province}</span>
          <span className="mx-0.5">·</span>
          <span>{tour.duration}</span>
        </div>

        {/* rating + badge ยอดนิยม */}
        <div className="flex items-center gap-1.5 mb-2">
          <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">{tour.rating.toFixed(1)}</span>
          <span className="text-sm font-medium text-gray-400">({tour.reviewCount} รีวิว)</span>
          {tour.reviewCount > 50 && (
            <span className="ml-auto text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">ยอดนิยม</span>
          )}
        </div>

        {/* info grid: duration + highlights แบบ 2 คอลัมน์ */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 mb-2 mt-3">
          <div className="flex items-center gap-1.5">
            <ClockIcon />
            <p className="text-sm font-medium text-gray-500 truncate">{tour.duration}</p>
          </div>
          {tour.highlights.slice(0, 3).map((h, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <CheckIcon />
              <p className="text-sm font-medium text-gray-500 truncate">{h}</p>
            </div>
          ))}
        </div>

        {/* ราคา + discount badge */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          {hasDiscount && (
            <span className="text-sm font-medium text-gray-400 line-through">
              ฿{Number(tour.originalPrice).toLocaleString()}
            </span>
          )}
          <span className="text-lg font-bold text-accent">
            ฿{Number(tour.price).toLocaleString()}
          </span>
          <span className="text-sm font-medium text-gray-400">/ ท่าน</span>
        </div>
      </div>
    </Link>
  )
}
