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
    <div className="flex items-center gap-2 text-[16px] font-medium leading-tight text-gray-600">
      {iconNode}
      <span className="line-clamp-1">{text}</span>
    </div>
  )
}

function normalizeHighlight(text: string) {
  if (text.includes('รถรับส่ง')) return 'บริการรถรับส่ง'
  if (text.includes('อาหาร')) return 'รวมอาหารกลางวัน'
  if (text.includes('ยกเลิก')) return 'สามารถยกเลิกได้'
  if (text.includes('ไม่รวม')) return 'ไม่รวมค่าใช้จ่ายเพิ่มเติม'
  if (text.includes('ไกด์')) return 'มีไกด์นำเที่ยว'
  if (text.includes('ส่วนลด')) return 'มีส่วนลดสำหรับเด็ก'
  if (text.includes('ส่วนตัว')) return 'เหมาะสำหรับทริปส่วนตัว'
  if (text.includes('กลุ่ม')) return 'เหมาะสำหรับทริปกลุ่ม'
  if (text.includes('กิจกรรม')) return 'มีกิจกรรมสนุกๆ'
  if (text.includes('ธรรมชาติ')) return 'ชมธรรมชาติสวยงาม'
  if (text.includes('วัฒนธรรม')) return 'สัมผัสวัฒนธรรมท้องถิ่น'
  if (text.includes('ประวัติศาสตร์')) return 'เรียนรู้ประวัติศาสตร์'
  if (text.includes('ผจญภัย')) return 'เหมาะสำหรับคนรักการผจญภัย'
  if (text.includes('พักผ่อน')) return 'เหมาะสำหรับคนรักการพักผ่อน'
  if (text.includes('ถ่ายรูป')) return 'มีจุดถ่ายรูปสวยๆ'
  return text
}

export default function TourCard({ tour }: TourCardProps) {
  const isPrivate = !!tour.minPeople
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
      {hasDiscount && (
        <div className="absolute right-0 top-0 z-10 flex min-h-[1rem] min-w-[2rem] flex-col items-center justify-center rounded-bl-[1.15rem] rounded-tr-[0.25rem] bg-red-500 px-4 py-2.5 text-right text-white">
          <p className="text-[1rem] font-black leading-none">ลด {discountPercent}%</p>
          <p className=" text-[1rem] font-semibold leading-none text-white/80 line-through">
          </p>
        </div>
      )}

      <div className="h-[180px] overflow-hidden border-b border-gray-100 bg-slate-100">
        <img
          src={coverImage}
          alt={tour.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>

      <div className="grid flex-1 grid-rows-[auto_auto_1fr_auto] px-3.5 pb-5 pt-3.5">
        <h3 className="line-clamp-2 text-[1.25rem] font-bold leading-[1.5] text-gray-900">
          {tour.name}
        </h3>

        <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[16px] font-bold text-gray-600">
          <span className="inline-flex items-center gap-1 leading-none text-gray-700">
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
              <p className="text-[1.05rem] font-semibold text-gray-500">
                {isPrivate ? 'ราคาเหมาส่วนตัว' : 'ราคาเริ่มต้น'}
              </p>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-gray-900">
                <span className="mt-1 text-[1.7rem] font-extrabold leading-none">{Number(tour.price).toLocaleString()}</span>
                <span className="text-[1rem] font-semibold text-gray-500">
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
