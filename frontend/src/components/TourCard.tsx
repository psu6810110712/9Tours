import { Link } from 'react-router-dom'
import { trackEvent } from '../services/trackingService'
import type { Tour } from '../types/tour'

interface TourCardProps {
  tour: Tour
}

function ClockIcon() {
  return (
    <svg className="h-4 w-4 flex-shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
      <circle cx="12" cy="12" r="8.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5v5l3 2" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4 flex-shrink-0 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function CrossIcon() {
  return (
    <svg className="h-4 w-4 flex-shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.1}>
      <circle cx="12" cy="12" r="8.5" />
      <path strokeLinecap="round" d="M9 9l6 6" />
      <path strokeLinecap="round" d="M15 9l-6 6" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg className="h-3.5 w-3.5 flex-shrink-0 fill-current text-yellow-400" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

function FeaturedBadge() {
  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-400 px-1.5 text-[11px] font-extrabold leading-none text-white">
      1
    </span>
  )
}

interface DetailItemProps {
  icon: 'clock' | 'check' | 'cross'
  text: string
}

function DetailItem({ icon, text }: DetailItemProps) {
  const iconNode = icon === 'clock'
    ? <ClockIcon />
    : icon === 'cross'
      ? <CrossIcon />
      : <CheckIcon />

  return (
    <div className="flex items-center gap-1.5 text-[12.5px] font-medium leading-tight text-gray-600">
      {iconNode}
      <span className="line-clamp-1">{text}</span>
    </div>
  )
}

function normalizeHighlight(text: string) {
  if (text.includes('รถรับส่ง')) return 'บริการรถรับส่ง'
  if (text.includes('อาหาร')) return 'รวมอาหารกลางวัน'
  if (text.includes('ยกเลิก')) return 'สามารถยกเลิกได้'
  return text
}

export default function TourCard({ tour }: TourCardProps) {
  const originalPrice = tour.originalPrice
  const hasDiscount = typeof originalPrice === 'number' && originalPrice > tour.price
  const discountPercent = hasDiscount
    ? Math.round((1 - tour.price / originalPrice) * 100)
    : null
  const coverImage = tour.images[0] || 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=400'
  const isPopular = tour.reviewCount > 50

  const detailItems = [
    { icon: 'clock' as const, text: tour.duration },
    { icon: 'cross' as const, text: normalizeHighlight(tour.highlights.find((item) => item.includes('ยกเลิก')) || 'สามารถยกเลิกได้') },
    { icon: 'check' as const, text: normalizeHighlight(tour.highlights.find((item) => !item.includes('ยกเลิก')) || 'รวมอาหารกลางวัน') },
  ]

  const metaText = isPopular ? 'ยอดจองสูงสุด' : 'ยอดจองดี'

  return (
    <Link
      to={`/tours/${tour.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-[1.15rem] border border-gray-300 bg-white shadow-[0_3px_10px_rgba(15,23,42,0.05)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(15,23,42,0.10)]"
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
      <div className="h-[168px] overflow-hidden border-b border-gray-200 bg-slate-100">
        <img
          src={coverImage}
          alt={tour.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>

      <div className="flex flex-1 flex-col px-3.5 pb-3.5 pt-2.5">
        <h3 className="line-clamp-2 min-h-[2.95rem] text-[1.02rem] font-extrabold leading-5 text-gray-900">
          {tour.name}
        </h3>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12.5px] font-semibold text-gray-600">
          <span className="inline-flex items-center gap-1 leading-none text-gray-700">
            <StarIcon />
            <span>{tour.rating.toFixed(1)}</span>
            <span className="text-gray-500">({tour.reviewCount.toLocaleString()} รีวิว)</span>
          </span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-500">{metaText}</span>
          {isPopular && <FeaturedBadge />}
        </div>

        <div className="mt-2.5 grid gap-1.5">
          {detailItems.map((item, index) => (
            <DetailItem key={`${item.text}-${index}`} icon={item.icon} text={item.text} />
          ))}
        </div>

        <div className="mt-auto pt-3">
          <div className="flex items-end justify-between gap-3 border-t border-gray-200 pt-2.5">
            <div className="min-w-0">
              {hasDiscount ? (
                <p className="text-[13px] font-semibold leading-none text-gray-400 line-through">
                  ฿{Number(tour.originalPrice).toLocaleString()}
                </p>
              ) : (
                <div className="h-[13px]" />
              )}
              <div className="mt-1 flex items-end gap-1 text-gray-900">
                <span className="text-[1.9rem] font-extrabold leading-none">฿{Number(tour.price).toLocaleString()}</span>
                <span className="pb-1 text-[13px] font-semibold text-gray-600">/ ท่าน</span>
              </div>
            </div>

            {discountPercent && (
              <span className="rounded-full bg-red-500 px-3 py-1 text-[12px] font-extrabold leading-none text-white shadow-sm">
                ถูกลง {discountPercent}%
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
