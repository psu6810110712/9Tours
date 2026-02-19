import type { Tour } from '../../types/tour'

interface TourInfoProps {
  tour: Tour
}

export default function TourInfo({ tour }: TourInfoProps) {
  return (
    <>
      {/* สรุปทัวร์ */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <div className="flex items-center flex-wrap gap-2 mb-2">
          <span className="text-xs bg-[var(--color-accent-light)] text-[#B46A00] px-2 py-1 rounded-full font-semibold">
            {tour.tourType === 'one_day' ? 'วันเดย์ทริป' : 'แพ็คเกจ'}
          </span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            {tour.province}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <span className="text-yellow-400">★</span>
          <span className="font-semibold text-gray-700">{tour.rating.toFixed(1)}</span>
          <span>({tour.reviewCount} รีวิว)</span>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">{tour.description}</p>
      </div>

      {/* ข้อมูลทัวร์ — ดึงจากข้อมูลจริง ไม่ hardcode */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <h2 className="font-bold text-gray-800 mb-3">เกี่ยวกับทัวร์นี้</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
          {tour.duration && (
            <p className="text-sm text-gray-700">⏱ {tour.duration}</p>
          )}
          {tour.transportation && (
            <p className="text-sm text-gray-700">🚐 {tour.transportation}</p>
          )}
          {tour.accommodation && (
            <p className="text-sm text-gray-700">🏨 {tour.accommodation}</p>
          )}
        </div>
      </div>

      {/* highlights */}
      {tour.highlights.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <h2 className="font-bold text-gray-800 mb-3">สิ่งที่รวมในทริป</h2>
          <ul className="space-y-1.5">
            {tour.highlights.map((h, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* หมวดหมู่ */}
      {tour.categories.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
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
