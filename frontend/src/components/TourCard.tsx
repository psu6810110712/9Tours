import { Link } from 'react-router-dom'
import { trackEvent } from '../services/trackingService'
import type { Tour } from '../types/tour'

interface TourCardProps {
  tour: Tour
}

function ClockIcon() {
  return (
    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 7v5l3 3" />
    </svg>
  )
}

function LocationIcon() {
  return (
    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657 13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg className="h-4 w-4 flex-shrink-0 fill-current text-amber-400" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

export default function TourCard({ tour }: TourCardProps) {
  const originalPrice = tour.originalPrice
  const hasDiscount = typeof originalPrice === 'number' && originalPrice > tour.price
  const discountPercent = hasDiscount
    ? Math.round((1 - tour.price / originalPrice) * 100)
    : null
  const coverImage = tour.images[0] || 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=400'
  const highlightItems = tour.highlights.slice(0, 2)
  const isPopular = tour.reviewCount > 50

  return (
    <Link
      to={`/tours/${tour.id}`}
      className="ui-surface ui-pressable group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white"
      onClick={() => {
        trackEvent({
          eventType: 'cta_click',
          pagePath: window.location.pathname + window.location.search,
          tourId: tour.id,
          elementId: 'tour_card_click',
          metadata: { province: tour.province, tourType: tour.tourType },
        })
      }}
    >
      <div className="relative h-44 overflow-hidden bg-slate-100">
        <img
          src={coverImage}
          alt={tour.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/10 to-transparent" />

        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className="rounded-full bg-slate-950/65 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
            {tour.tourType === 'one_day' ? 'วันเดย์ทริป' : 'แพ็กเกจ'}
          </span>
          {discountPercent && (
            <span className="rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
              -{discountPercent}%
            </span>
          )}
        </div>

        {isPopular && (
          <div className="absolute bottom-3 right-3 rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-bold text-amber-700 shadow-sm backdrop-blur-sm">
            ยอดนิยม
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div>
          <h3 className="line-clamp-2 min-h-[3.2rem] text-[1.12rem] font-bold leading-6 text-slate-900">
            {tour.name}
          </h3>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-slate-600">
            <span className="inline-flex items-center gap-1.5 font-semibold leading-none">
              <LocationIcon />
              <span className="truncate">{tour.province}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold leading-none">
              <ClockIcon />
              <span>{tour.duration}</span>
            </span>
          </div>

          <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[12px] font-semibold text-slate-700">
            <StarIcon />
            <span>{tour.rating.toFixed(1)}</span>
            <span className="text-slate-500">{tour.reviewCount.toLocaleString()} รีวิว</span>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {highlightItems.map((highlight, index) => (
            <div key={index} className="flex items-start gap-2 rounded-[1rem] bg-slate-50 px-3 py-2 text-[13px] text-slate-700">
              <CheckIcon />
              <p className="line-clamp-1 font-medium">{highlight}</p>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-4">
          <div className="flex items-end justify-between gap-3 rounded-[1.1rem] border border-slate-100 bg-slate-50 px-3.5 py-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                ราคาเริ่มต้น
              </p>
              <div className="mt-1 flex items-end gap-2 text-sm">
                <span className="text-[1.6rem] font-black leading-none text-[var(--color-accent)]">
                  ฿{Number(tour.price).toLocaleString()}
                </span>
                <span className="pb-0.5 font-semibold text-slate-500">/ ท่าน</span>
              </div>
            </div>
            <div className="text-right text-xs">
              {hasDiscount && (
                <span className="block font-semibold text-slate-400 line-through">
                  ฿{Number(tour.originalPrice).toLocaleString()}
                </span>
              )}
              <p className="mt-1 font-semibold text-slate-500">จองง่าย</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
