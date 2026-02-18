import type { Tour } from '../../types/tour'

interface TourInfoProps {
  tour: Tour
}

export default function TourInfo({ tour }: TourInfoProps) {
  return (
    <>
      {/* ชื่อ คะแนน คำอธิบาย */}
      <div className="bg-white rounded-xl p-5 mb-4">
        <div className="flex gap-2 mb-2">
          <span className="text-xs bg-[#F5A623]/10 text-[#F5A623] px-2 py-1 rounded-full font-medium">
            {tour.tourType === 'one_day' ? 'วันเดย์ทริป' : 'แพ็คเกจ'}
          </span>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
            {tour.province}
          </span>
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">{tour.name}</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <span className="text-yellow-400">★★★★★</span>
          <span className="font-semibold text-gray-700">{tour.rating.toFixed(1)}</span>
          <span>({tour.reviewCount} รีวิว)</span>
          <span>·</span>
          <span>⏱ {tour.duration}</span>
          {tour.transportation && (
            <><span>·</span><span>🚗 {tour.transportation}</span></>
          )}
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">{tour.description}</p>
      </div>

      {/* highlights */}
      {tour.highlights.length > 0 && (
        <div className="bg-white rounded-xl p-5 mb-4">
          <h2 className="font-bold text-gray-800 mb-3">เกี่ยวกับทัวร์นี้</h2>
          <div className="flex flex-wrap gap-2">
            {tour.highlights.map((h, i) => (
              <span key={i} className="flex items-center gap-1 bg-green-50 text-green-700 text-sm px-3 py-1 rounded-full">
                <span>✓</span> {h}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* หมวดหมู่ */}
      {tour.categories.length > 0 && (
        <div className="bg-white rounded-xl p-5 mb-4">
          <h2 className="font-bold text-gray-800 mb-3">หมวดหมู่</h2>
          <div className="flex flex-wrap gap-2">
            {tour.categories.map((cat, i) => (
              <span key={i} className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
