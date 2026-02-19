import { Link } from 'react-router-dom'
import type { Tour } from '../types/tour'

interface TourCardProps {
  tour: Tour
}

export default function TourCard({ tour }: TourCardProps) {
  const discountPercent = tour.originalPrice
    ? Math.round((1 - tour.price / tour.originalPrice) * 100)
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
        <span className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
          {tour.tourType === 'one_day' ? 'วันเดย์ทริป' : 'แพ็คเกจ'}
        </span>
      </div>

      {/* เนื้อหา */}
      <div className="p-3">
        {/* ชื่อทัวร์ */}
        <h3 className="font-semibold text-gray-800 text-sm truncate mb-1">
          {tour.name}
        </h3>

        {/* จังหวัด + ระยะเวลา */}
        <p className="text-xs text-gray-400 mb-2">
          📍 {tour.province} · {tour.duration}
        </p>

        {/* คะแนน */}
        <div className="flex items-center gap-1 mb-2">
          <span className="text-yellow-400 text-xs">★</span>
          <span className="text-xs font-medium text-gray-700">{tour.rating.toFixed(1)}</span>
          <span className="text-xs text-gray-400">({tour.reviewCount} รีวิว)</span>
        </div>

        {/* highlights 2 รายการแรก */}
        {tour.highlights.slice(0, 2).map((h, i) => (
          <div key={i} className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <span className="text-green-500">✓</span>
            <span>{h}</span>
          </div>
        ))}

        {/* ราคา */}
        <div className="mt-2 flex items-end gap-2">
          {tour.originalPrice && (
            <span className="text-xs text-gray-400 line-through">
              ฿{tour.originalPrice.toLocaleString()}
            </span>
          )}
          <span className="text-base font-bold text-[#F5A623]">
            ฿{Number(tour.price).toLocaleString()}
          </span>
          <span className="text-xs text-gray-400">/ คน</span>
        </div>
      </div>
    </Link>
  )
}
