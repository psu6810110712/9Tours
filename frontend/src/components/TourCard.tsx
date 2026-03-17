import { Link } from 'react-router-dom'
import { trackEvent } from '../services/trackingService'
import type { Tour } from '../types/tour'

interface TourCardProps {
  tour: Tour
  isFavorite?: boolean
  isInactive?: boolean
  onToggleFavorite?: (tourId: number) => void
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

function StarIcon() {
  return (
    <svg className="h-7 w-7 flex-shrink-0 fill-current text-yellow-400" viewBox="0 0 20 23" aria-hidden="true">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

function FeaturedBadge() {
  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-400 px-1.5 text-[12px] font-extrabold leading-none text-white">
      1
    </span>
  )
}

interface DetailItemProps {
  icon: 'clock' | 'check'
  text: string
}

function DetailItem({ icon, text }: DetailItemProps) {
  const iconNode = icon === 'clock'
    ? <ClockIcon />
    : <CheckIcon />

  return (
    <div className="flex items-center gap-2 text-[16px] font-medium leading-tight text-gray-600">
      {iconNode}
      <span className="line-clamp-1">{text}</span>
    </div>
  )
}

function getCardDetailItems(tour: Tour) {
  const secondLine = tour.highlights[0]?.trim() || 'รายละเอียดเด่นของทัวร์'
  const thirdLine = tour.tourType === 'package'
    ? tour.accommodation?.trim() || 'มีที่พักรวมในแพ็กเกจ'
    : tour.highlights[1]?.trim() || 'ไฮไลต์เพิ่มเติมของทริป'

  return [
    { icon: 'clock' as const, text: tour.duration },
    { icon: 'check' as const, text: secondLine },
    { icon: 'check' as const, text: thirdLine },
  ]
}

function HeartButton({ active, onClick }: { active: boolean; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={active ? 'ลบออกจากรายการถูกใจ' : 'เพิ่มในรายการถูกใจ'}
      aria-pressed={active}
      className="ui-pressable absolute left-2.5 top-2.5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur transition-colors hover:bg-white"
    >
      <svg
        className={`h-5 w-5 transition-colors ${active ? 'fill-red-500 text-red-500' : 'fill-none text-gray-500'}`}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={active ? 0 : 2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  )
}

export default function TourCard({ tour, isFavorite = false, isInactive = false, onToggleFavorite }: TourCardProps) {
  const isPrivate = !!tour.minPeople
  const originalPrice = tour.originalPrice
  const hasDiscount = typeof originalPrice === 'number' && originalPrice > tour.price
  const discountPercent = hasDiscount
    ? Math.round((1 - tour.price / originalPrice) * 100)
    : null
  const coverImage = tour.images.find((image) => typeof image === 'string' && image.trim().length > 0) || ''
  const hasCoverImage = coverImage.length > 0
  const isPopular = tour.reviewCount > 50

  const detailItems = getCardDetailItems(tour)

  const metaText = isPopular ? 'ทัวร์ยอดนิยม' : 'แนะนำสำหรับคุณ'

  return (
    <Link
      to={`/tours/${tour.id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-[1.15rem] border border-gray-200 bg-white shadow-[0_3px_10px_rgba(15,23,42,0.05)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_22px_rgba(15,23,42,0.10)]"
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
      {onToggleFavorite && (
        <HeartButton
          active={isFavorite}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onToggleFavorite(tour.id)
          }}
        />
      )}

      {hasDiscount && (
        <div className="absolute right-0 top-0 z-10 flex min-h-[1rem] min-w-[2rem] flex-col items-center justify-center rounded-bl-[1.15rem] rounded-tr-[0.25rem] bg-red-500 px-4 py-2.5 text-right text-white">
          <p className="text-[1rem] font-black leading-none">ลด {discountPercent}%</p>
          {tour.discountEndDate && (
            <p className="mt-1 text-[0.8rem] font-semibold leading-none text-white/80">
              ถึง {new Date(tour.discountEndDate + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
            </p>
          )}
        </div>
      )}

      {isInactive && (
        <div className="absolute inset-0 z-30 flex items-center justify-center rounded-[1.15rem] bg-black/40">
          <span className="rounded-xl bg-white/90 px-4 py-2 text-sm font-semibold text-gray-700 shadow">
            ทัวร์นี้ปิดให้บริการชั่วคราว
          </span>
        </div>
      )}

      <div className="h-[180px] overflow-hidden border-b border-gray-100 bg-slate-100">
        {hasCoverImage ? (
          <img
            src={coverImage}
            alt={tour.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-6 text-center">
            <p className="text-lg font-bold text-slate-600">ไม่มีภาพประกอบสำหรับทัวร์นี้</p>
          </div>
        )}
      </div>

      <div className="grid flex-1 grid-rows-[auto_auto_1fr_auto] px-3.5 pb-5 pt-3.5">
        <h3 className="mt-1 line-clamp-2 text-[1.125rem] font-bold leading-[1.4] text-gray-700">
          {tour.name}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[16px] font-extrabold text-gray-600">
          <span className="inline-flex items-center gap-1 leading-none text-gray-600">
            <StarIcon />
            <span>{tour.rating.toFixed(1)}</span>
            <span className="text-gray-500">({tour.reviewCount.toLocaleString()} รีวิว)</span>
          </span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-500">{metaText}</span>
          {isPopular && <FeaturedBadge />}
        </div>

        <div className="mt-2 grid gap-1.5">
          {detailItems.map((item, index) => (
            <DetailItem key={`${item.text}-${index}`} icon={item.icon} text={item.text} />
          ))}
        </div>

        <div className="-mx-2 -mb-8 mt-5 border-t border-gray-200">
          <div className="relative min-h-[6.25rem] px-3.5 py-2.5">
            <div>
              <p className="text-[1.05rem] font-semibold text-gray-700">
                {isPrivate ? 'ราคาเหมาส่วนตัว' : 'ราคาเริ่มต้น'}
              </p>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[var(--color-primary)]">
                <span className="mt-1 text-[1.7rem] font-extrabold leading-none">{Number(tour.price).toLocaleString()}</span>
                <span className="text-[1rem] font-semibold text-[var(--color-primary)]">
                  {isPrivate ? 'บาท' : 'บาท / ท่าน'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
