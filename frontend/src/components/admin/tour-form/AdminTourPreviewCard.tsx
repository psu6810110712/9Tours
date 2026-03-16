import type { Tour } from '../../../types/tour'

interface AdminTourPreviewCardProps {
  tour: Tour
}

function ClockIcon() {
  return (
    <svg className="h-4 w-4 flex-shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
      <circle cx="12" cy="12" r="8.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5v5l3 2" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4 flex-shrink-0 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function PhotoIcon() {
  return (
    <svg className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2 1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2Z" />
    </svg>
  )
}

function getCardDetailItems(tour: Tour) {
  const secondLine = tour.highlights[0]?.trim() || 'ไฮไลต์ทัวร์จะขึ้นตรงนี้'
  const thirdLine = tour.tourType === 'package'
    ? tour.accommodation?.trim() || 'รายละเอียดที่พักจะแสดงบนบรรทัดนี้'
    : tour.highlights[1]?.trim() || 'เพิ่มข้อความเสริมเพื่อให้การ์ดดูน่าสนใจ'

  return [
    { icon: 'clock' as const, text: tour.duration },
    { icon: 'check' as const, text: secondLine },
    { icon: 'check' as const, text: thirdLine },
  ]
}

export default function AdminTourPreviewCard({ tour }: AdminTourPreviewCardProps) {
  const coverImage = tour.images.find((image) => typeof image === 'string' && image.trim().length > 0) || ''
  const hasCoverImage = coverImage.length > 0
  const originalPrice = tour.originalPrice
  const hasDiscount = typeof originalPrice === 'number' && originalPrice > tour.price
  const discountPercent = hasDiscount
    ? Math.round((1 - tour.price / originalPrice) * 100)
    : null
  const isPrivate = !!tour.minPeople
  const detailItems = getCardDetailItems(tour)

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white">
      <div className="bg-white p-5">
        <div className="mb-4 text-center">
          <p className="text-base text-xl font-bold text-gray-800">นี่คือการ์ดที่ลูกค้าจะเห็น</p>
        </div>
        <div className="relative overflow-hidden rounded-[1.15rem] border border-gray-200 bg-white">
          {hasDiscount && (
            <div className="absolute right-0 top-0 z-10 flex min-h-[1rem] min-w-[2rem] flex-col items-center justify-center rounded-bl-[1.15rem] rounded-tr-[0.25rem] bg-red-500 px-4 py-2.5 text-right text-white">
              <p className="text-[1rem] font-black leading-none">ลด {discountPercent}%</p>
            </div>
          )}

          <div className="h-[180px] overflow-hidden border-b border-gray-100 bg-slate-100">
            {hasCoverImage ? (
              <img src={coverImage} alt={tour.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-slate-100 px-6 text-center">
                <PhotoIcon />
                <div>
                  <p className="text-lg font-bold text-slate-600">ไม่มีภาพประกอบสำหรับทัวร์นี้</p>
                  <p className="mt-1 text-sm text-slate-500">เพิ่มรูปทางขวาเพื่อดูพรีวิวทันที</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-rows-[auto_auto_1fr_auto] px-3.5 pb-5 pt-3.5">
            <h3 className="mt-1 line-clamp-2 text-[1.125rem] font-bold leading-[1.4] text-gray-700">
                {tour.name}
            </h3>

            <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[16px] font-extrabold text-gray-600">
              <span className="inline-flex items-center gap-1 leading-none text-gray-600">
                <svg className="h-7 w-7 flex-shrink-0 fill-current text-yellow-400" viewBox="0 0 20 23" aria-hidden="true">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>4.8</span>
                <span className="text-gray-500">(176 รีวิว)</span>
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500">ทัวร์ยอดนิยม</span>
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-yellow-400 px-1.5 text-[12px] font-extrabold leading-none text-white">
                1
              </span>
            </div>

            <div className="mt-2 grid gap-1.5">
              {detailItems.map((item, index) => (
                <div key={`${item.text}-${index}`} className="flex items-center gap-2 text-[16px] font-medium leading-tight text-gray-600">
                  {item.icon === 'clock' ? <ClockIcon /> : <CheckIcon />}
                  <span className="line-clamp-1">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="-mx-2 -mb-8 mt-5 border-t border-gray-200">
              <div className="relative min-h-[6.25rem] px-3.5 py-2.5">
                <p className="text-[1.05rem] font-semibold text-gray-700">
                {isPrivate ? 'ราคาเหมาส่วนตัว' : 'ราคาเริ่มต้น'}
                </p>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-gray-700">
                  <span className="mt-1 text-[1.7rem] font-extrabold leading-none">{Number(tour.price).toLocaleString()}</span>
                  <span className="text-[1rem] font-semibold text-gray-700">
                  {isPrivate ? 'บาท' : 'บาท / ท่าน'}
                  </span>
                  {hasDiscount && typeof originalPrice === 'number' && (
                    <span className="text-[0.95rem] font-semibold text-gray-400 line-through">{originalPrice.toLocaleString()} บาท</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
