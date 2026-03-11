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
  const durationCaption = tour.tourType === 'one_day'
    ? 'ทริปแบบไปเช้าเย็นกลับ'
    : 'ทริปที่มีเวลาพักผ่อนกำลังดี'

  return (
    <>
      <section className="ui-surface mb-5 overflow-hidden rounded-[1.75rem] border border-gray-100 bg-white p-5 sm:p-6">
        <div className="rounded-[1.5rem] bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_38%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-amber-200/80 bg-[linear-gradient(180deg,#FFF7E8_0%,#FCEFD7_100%)] px-4 py-2 text-sm font-bold text-[#B46A00] shadow-[0_10px_24px_rgba(245,166,35,0.12)]">
            {tour.tourType === 'one_day' ? 'วันเดย์ทริป' : 'แพ็กเกจ'}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
              {tour.province}
            </span>
            {tour.categories.slice(0, 2).map((category, index) => (
              <span
                key={index}
                className="rounded-full border border-blue-100 bg-[linear-gradient(180deg,#EEF5FF_0%,#DFECFF_100%)] px-4 py-2 text-sm font-semibold text-blue-700 shadow-[0_10px_24px_rgba(37,99,235,0.08)]"
              >
                {category}
              </span>
            ))}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="relative overflow-hidden rounded-[1.75rem] border border-amber-100 bg-[linear-gradient(135deg,#FFF8EB_0%,#FFFFFF_72%)] px-5 py-5 shadow-[0_18px_34px_rgba(245,166,35,0.08)]">
              <div className="absolute right-4 top-3 h-20 w-20 rounded-full bg-amber-200/40 blur-2xl" />
              <p className="relative text-sm font-semibold tracking-[0.08em] text-slate-500">คะแนนรีวิว</p>
              <div className="relative mt-4 flex items-center gap-4">
                <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[1.35rem] bg-amber-100 text-2xl text-amber-500 shadow-inner">
                  ★
                </span>
                <div className="min-w-0">
                  <div className="flex items-end gap-2">
                    <span className="text-[2.3rem] font-bold leading-none text-slate-900">{tour.rating.toFixed(1)}</span>
                    <span className="mb-1 text-sm font-semibold text-slate-400">/ 5.0</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-500">{tour.reviewCount} รีวิวจากผู้เดินทาง</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[1.75rem] border border-blue-100 bg-[linear-gradient(135deg,#EEF5FF_0%,#FFFFFF_72%)] px-5 py-5 shadow-[0_18px_34px_rgba(37,99,235,0.08)]">
              <div className="absolute right-4 top-3 h-20 w-20 rounded-full bg-blue-200/40 blur-2xl" />
              <p className="relative text-sm font-semibold tracking-[0.08em] text-slate-500">ระยะเวลา</p>
              <div className="relative mt-4 flex items-center gap-4">
                <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[1.35rem] bg-blue-100 text-blue-600 shadow-inner">
                  <ClockIcon />
                </span>
                <div className="min-w-0">
                  <p className="text-[2rem] font-bold leading-none text-slate-900">{tour.duration}</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">{durationCaption}</p>
                </div>
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
