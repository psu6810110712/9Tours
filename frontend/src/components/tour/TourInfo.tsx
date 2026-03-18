import { useState } from 'react'
import type { Tour } from '../../types/tour'

interface TourInfoProps {
  tour: Tour
}

function ClockIcon() {
  return (
    <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 7v5l3 3" />
    </svg>
  )
}

function VanIcon() {
  return (
    <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h.01M16 17h.01M3 11l1.5-5A2 2 0 016.4 4h11.2a2 2 0 011.9 1.4L21 11M3 11v6a1 1 0 001 1h1m16-7v6a1 1 0 01-1 1h-1M3 11h18" />
    </svg>
  )
}

const DESC_LIMIT = 220

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="ui-surface mb-4 rounded-[1.25rem] border border-gray-100 bg-white p-4 sm:mb-5 sm:p-6">
      <h2 className="mb-3 text-base font-bold text-gray-900 sm:mb-4 sm:text-lg">{title}</h2>
      {children}
    </section>
  )
}

export default function TourInfo({ tour }: TourInfoProps) {
  const [expanded, setExpanded] = useState(false)
  const isLong = tour.description.length > DESC_LIMIT
  const descriptionText = expanded || !isLong
    ? tour.description
    : `${tour.description.slice(0, DESC_LIMIT)} ...`
  const durationCaption = tour.tourType === 'one_day'
    ? 'ทริปแบบไปเช้าเย็นกลับ'
    : 'ทริปที่มีเวลาพักผ่อนกำลังดี'

  return (
    <>
      <section className="ui-surface mb-4 rounded-[1.25rem] border border-gray-100 bg-white p-4 sm:mb-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[var(--color-accent-light)] px-3 py-1 text-xs font-semibold text-[#B46A00] sm:text-sm">
            {tour.tourType === 'one_day' ? 'วันเดย์ทริป' : 'แพ็กเกจ'}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 sm:text-sm">
            {tour.province}
          </span>
          {tour.categories.slice(0, 2).map((category, index) => (
            <span key={index} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 sm:text-sm">
              {category}
            </span>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.25rem] border border-gray-100 bg-gray-50 px-4 py-3 sm:px-5 sm:py-4">
            <p className="text-sm font-semibold text-gray-500 sm:text-base">คะแนนรีวิว</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-base text-amber-500 sm:h-10 sm:w-10">
                ★
              </span>
              <div className="min-w-0">
                <div className="flex items-end gap-2">
                  <span className="text-[1.35rem] font-bold leading-none text-gray-900 sm:text-[1.55rem]">{tour.rating.toFixed(1)}</span>
                  <span className="mb-0.5 text-xs font-semibold text-gray-400 sm:text-sm">/ 5.0</span>
                </div>
                <p className="mt-1 text-xs font-medium text-gray-500 sm:text-sm">{tour.reviewCount} รีวิวจากผู้เดินทาง</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-gray-100 bg-gray-50 px-4 py-3 sm:px-5 sm:py-4">
            <p className="text-sm font-semibold text-gray-500 sm:text-base">ระยะเวลา</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 sm:h-10 sm:w-10">
                <span className="scale-90">
                  <ClockIcon />
                </span>
              </span>
              <div className="min-w-0">
                <p className="text-[1.2rem] font-bold leading-none text-gray-900 sm:text-[1.4rem]">{tour.duration}</p>
                <p className="mt-1 text-xs font-medium text-gray-500 sm:text-sm">{durationCaption}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SectionCard title="รายละเอียดทัวร์">
        <p className="whitespace-pre-line text-base leading-8 text-gray-600">{descriptionText}</p>
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="mt-4 text-sm font-semibold text-primary transition-colors hover:text-primary-dark"
          >
            {expanded ? 'แสดงน้อยลง' : 'แสดงเพิ่มเติม'}
          </button>
        )}
      </SectionCard>

      <SectionCard title="เกี่ยวกับทัวร์นี้">
        <div className="grid gap-2 sm:grid-cols-2">
          {tour.highlights.map((highlight, index) => (
            <div key={index} className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2 sm:px-4 sm:py-3">
              <svg className="h-4 w-4 flex-shrink-0 text-primary sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium text-gray-700 sm:text-base">{highlight}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {tour.accommodation && (
        <SectionCard title="ที่พัก">
          <p className="whitespace-pre-line text-base leading-8 text-gray-600">{tour.accommodation}</p>
        </SectionCard>
      )}

      {tour.transportation && (
        <SectionCard title="คำแนะนำการเดินทาง">
          <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
            <div className="mt-0.5 text-primary">
              <VanIcon />
            </div>
            <p className="text-base leading-8 text-gray-600">{tour.transportation}</p>
          </div>
        </SectionCard>
      )}

      {tour.categories.length > 0 && (
        <SectionCard title="หมวดหมู่">
          <div className="flex flex-wrap gap-2">
            {tour.categories.map((category, index) => (
              <span key={index} className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 sm:px-4 sm:py-2 sm:text-sm">
                {category}
              </span>
            ))}
          </div>
        </SectionCard>
      )}
    </>
  )
}
