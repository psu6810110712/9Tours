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
    <section className="ui-surface mb-5 rounded-[1.5rem] border border-gray-100 bg-white p-6">
      <h2 className="mb-4 text-lg font-bold text-gray-900">{title}</h2>
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

  return (
    <>
      <section className="ui-surface mb-5 rounded-[1.5rem] border border-gray-100 bg-white p-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="rounded-full bg-[var(--color-accent-light)] px-3 py-1 text-sm font-semibold text-[#B46A00]">
            {tour.tourType === 'one_day' ? 'วันเดย์ทริป' : 'แพ็กเกจ'}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
            {tour.province}
          </span>
          {tour.categories.slice(0, 2).map((category, index) => (
            <span key={index} className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              {category}
            </span>
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.5rem] border border-gray-100 bg-gray-50 px-5 py-4">
            <p className="text-base font-semibold text-gray-500">คะแนนรีวิว</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-xl text-amber-500">
                ★
              </span>
              <div className="flex min-w-0 items-baseline gap-2">
                <span className="text-[2rem] font-bold leading-none text-gray-900">{tour.rating.toFixed(1)}</span>
                <span className="text-sm font-medium text-gray-500">({tour.reviewCount} รีวิว)</span>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-gray-100 bg-gray-50 px-5 py-4">
            <p className="text-base font-semibold text-gray-500">ระยะเวลา</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                <ClockIcon />
              </span>
              <span className="text-[1.65rem] font-bold leading-none text-gray-900">{tour.duration}</span>
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
        <div className="grid gap-3 sm:grid-cols-2">
          {tour.highlights.map((highlight, index) => (
            <div key={index} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
              <svg className="h-5 w-5 flex-shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-base font-medium text-gray-700">{highlight}</span>
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
              <span key={index} className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">
                {category}
              </span>
            ))}
          </div>
        </SectionCard>
      )}
    </>
  )
}
