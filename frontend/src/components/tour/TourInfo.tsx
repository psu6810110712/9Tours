import { useState } from 'react'
import type { Tour } from '../../types/tour'

interface TourInfoProps {
  tour: Tour
}

// SVG icons ใช้สีเดียวกับ text (currentColor) แทน emoji
function ClockIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 7v5l3 3" />
    </svg>
  )
}

function VanIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h.01M16 17h.01M3 11l1.5-5A2 2 0 016.4 4h11.2a2 2 0 011.9 1.4L21 11M3 11v6a1 1 0 001 1h1m16-7v6a1 1 0 01-1 1h-1M3 11h18" />
    </svg>
  )
}

// จำนวนตัวอักษรที่แสดงก่อนกด "แสดงเพิ่มเติม"
const DESC_LIMIT = 150

export default function TourInfo({ tour }: TourInfoProps) {
  const [expanded, setExpanded] = useState(false)

  // รวมข้อความ description + รายละเอียดที่พัก (ถ้ามี) เป็นก้อนเดียว
  const fullText = tour.accommodation
    ? `${tour.description}\n\nรายละเอียดที่พัก: ${tour.accommodation}`
    : tour.description

  const isLong = fullText.length > DESC_LIMIT
  const displayText = expanded || !isLong
    ? fullText
    : fullText.slice(0, DESC_LIMIT) + ' ...'

  return (
    <>
      {/* สรุปทัวร์ — badge + rating เท่านั้น (ไม่แสดง description ซ้ำ) */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
        <div className="flex items-center flex-wrap gap-2 mb-3">
          <span className="text-sm bg-[var(--color-accent-light)] text-[#B46A00] px-3 py-1 rounded-full font-semibold">
            {tour.tourType === 'one_day' ? 'วันเดย์ทริป' : 'แพ็คเกจ'}
          </span>
          <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">
            {tour.province}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 text-lg">★</span>
          <span className="text-base font-bold text-gray-800">{tour.rating.toFixed(1)}</span>
          <span className="text-sm font-medium text-gray-500">({tour.reviewCount} รีวิว)</span>
        </div>
      </div>

      {/* รายละเอียดทัวร์ — กดแสดงเพิ่มเติมถ้ายาว (รวมข้อมูลที่พักไว้ด้วย) */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
        <p className="text-base font-medium text-gray-600 leading-relaxed whitespace-pre-line">
          {displayText}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-blue-500 font-semibold text-sm mt-3 hover:text-blue-600 transition-colors"
          >
            {expanded ? 'แสดงน้อยลง' : 'แสดงเพิ่มเติม'}
          </button>
        )}
      </div>

      {/* เกี่ยวกับทัวร์นี้ — รวม duration + highlights ไว้ด้วยกัน */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
        <h2 className="text-lg font-bold text-gray-900 mb-4">เกี่ยวกับทัวร์นี้</h2>

        {tour.duration && (
          <div className="flex items-center gap-2.5 text-gray-700 mb-4">
            <ClockIcon />
            <span className="text-base font-medium">{tour.duration}</span>
          </div>
        )}

        {tour.highlights.length > 0 && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
            {tour.highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-base font-medium text-gray-700">{h}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* คำแนะนำการเดินทาง — แยกออกมาต่างหากจากข้อมูลทัวร์ */}
      {tour.transportation && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
          <h2 className="text-lg font-bold text-gray-900 mb-4">คำแนะนำการเดินทาง</h2>
          <div className="flex items-center gap-2.5 text-gray-700">
            <VanIcon />
            <span className="text-base font-medium">{tour.transportation}</span>
          </div>
        </div>
      )}

      {/* หมวดหมู่ */}
      {tour.categories.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
          <h2 className="text-lg font-bold text-gray-900 mb-4">หมวดหมู่</h2>
          <div className="flex flex-wrap gap-2">
            {tour.categories.map((cat, i) => (
              <span key={i} className="text-sm font-medium bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full">
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
