import { useState } from 'react'

interface MonthOption {
  value: string
  label: string
}

const CATEGORY_VISIBLE_COUNT = 6

const REGIONS = ['ภาคเหนือ', 'ภาคกลาง', 'ภาคใต้', 'ภาคตะวันออก', 'ภาคตะวันออกเฉียงเหนือ']

const PROVINCES_BY_REGION: Record<string, string[]> = {
  'ภาคเหนือ': ['เชียงใหม่', 'เชียงราย', 'ลำปาง', 'แม่ฮ่องสอน'],
  'ภาคกลาง': ['กรุงเทพฯ', 'อยุธยา', 'กาญจนบุรี'],
  'ภาคใต้': ['ภูเก็ต', 'กระบี่', 'สุราษฎร์ธานี', 'สงขลา', 'ชุมพร', 'นครศรีธรรมราช'],
  'ภาคตะวันออก': ['ชลบุรี', 'ระยอง', 'จันทบุรี'],
  'ภาคตะวันออกเฉียงเหนือ': ['ขอนแก่น', 'นครราชสีมา', 'อุดรธานี'],
}

interface FilterSidebarProps {
  region: string
  province: string
  tourType: string
  search: string
  categories: string[]
  month: string
  minPrice: number
  maxPrice: number
  priceBounds: {
    min: number
    max: number
  }
  availableCategories: string[]
  availableMonths: MonthOption[]
  onRegionChange: (value: string) => void
  onProvinceChange: (value: string) => void
  onTourTypeChange: (value: string) => void
  onCategoryToggle: (value: string) => void
  onMonthChange: (value: string) => void
  onMinPriceChange: (value: number) => void
  onMaxPriceChange: (value: number) => void
  onClear: () => void
  mode?: 'sidebar' | 'drawer'
  onClose?: () => void
}

export default function FilterSidebar({
  region,
  province,
  tourType,
  search,
  categories,
  month,
  minPrice,
  maxPrice,
  priceBounds,
  availableCategories,
  availableMonths,
  onRegionChange,
  onProvinceChange,
  onTourTypeChange,
  onCategoryToggle,
  onMonthChange,
  onMinPriceChange,
  onMaxPriceChange,
  onClear,
  mode = 'sidebar',
  onClose,
}: FilterSidebarProps) {
  const hasPriceFilter = minPrice > priceBounds.min || maxPrice < priceBounds.max
  const hasFilter = region || province || tourType || search || month || categories.length > 0 || hasPriceFilter
  const provinceOptions = region
    ? (PROVINCES_BY_REGION[region] ?? [])
    : Object.values(PROVINCES_BY_REGION).flat()

  const [showAllCategories, setShowAllCategories] = useState(false)

  // Sort categories: selected ones first, then the rest keep original order
  const sortedCategories = [...availableCategories].sort((a, b) => {
    const aSelected = categories.includes(a) ? 0 : 1
    const bSelected = categories.includes(b) ? 0 : 1
    return aSelected - bSelected
  })

  const hasMoreCategories = sortedCategories.length > CATEGORY_VISIBLE_COUNT
  const visibleCategories = showAllCategories
    ? sortedCategories
    : sortedCategories.slice(0, CATEGORY_VISIBLE_COUNT)
  const hiddenCount = sortedCategories.length - CATEGORY_VISIBLE_COUNT

  const isDrawer = mode === 'drawer'
  const priceRange = Math.max(1, priceBounds.max - priceBounds.min)
  const leftPercent = ((minPrice - priceBounds.min) / priceRange) * 100
  const rightPercent = 100 - (((maxPrice - priceBounds.min) / priceRange) * 100)

  return (
    <aside className={isDrawer ? 'w-full' : 'w-full lg:w-72 lg:flex-shrink-0'}>
      <div className={`ui-surface rounded-[1.5rem] border border-gray-100 bg-white p-5 ${isDrawer ? '' : 'lg:sticky lg:top-24'}`}>
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-gray-800">ตัวกรอง</h2>
          <div className="flex items-center gap-2">
            {hasFilter && (
              <button type="button" onClick={onClear} className="text-md font-semibold text-accent hover:underline">
                ล้างทั้งหมด
              </button>
            )}
            {isDrawer && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="ui-focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-md font-semibold uppercase tracking-[0.05em] text-gray-600">ประเภท</label>
            {(() => {
              const tourTypeOptions = [
                { value: '', label: 'ทั้งหมด' },
                { value: 'one_day', label: 'วันเดย์ทริป' },
                { value: 'package', label: 'แพ็กเกจ' },
              ]
              const activeIndex = tourTypeOptions.findIndex((o) => o.value === tourType)
              const count = tourTypeOptions.length

              return (
                <div className="relative flex rounded-full border border-gray-200 bg-gray-100 p-1">
                  {/* Sliding indicator */}
                  <div
                    className="absolute top-1 bottom-1 rounded-full shadow-sm transition-all duration-300 ease-in-out"
                    style={{
                      width: `calc(${100 / count}% - 0px)`,
                      left: `calc(${(activeIndex < 0 ? 0 : activeIndex) * (100 / count)}% + 0px)`,
                      background: 'var(--color-primary)',
                    }}
                  />
                  {tourTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onTourTypeChange(option.value)}
                      className={`relative z-10 flex-1 rounded-full px-2 py-2 text-center text-sm font-semibold transition-colors duration-300 ${tourType === option.value
                        ? 'text-white'
                        : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )
            })()}
          </div>

          <div>
            <label className="mb-2 block text-md font-semibold uppercase tracking-[0.05em] text-gray-600">หมวดหมู่</label>
            <div className="grid grid-cols-3 gap-2">
              {visibleCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => onCategoryToggle(category)}
                  className={`rounded-full border px-2 py-2 text-center text-sm font-semibold transition-colors ${categories.includes(category)
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            {hasMoreCategories && (
              <button
                type="button"
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="mt-2 flex w-full items-center justify-center gap-1 rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 px-3 py-2 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/10"
              >
                {showAllCategories ? '▲ แสดงน้อยลง' : `▼ +${hiddenCount} เพิ่มเติม`}
              </button>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="mt-2 block text-md font-semibold uppercase tracking-[0.05em] text-gray-600">เดือนที่เดินทาง</label>
              {month && (
                <button type="button" onClick={() => onMonthChange('')} className="text-xs font-semibold text-accent hover:underline">
                  ล้าง
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onMonthChange('')}
                className={`rounded-full border px-3 py-2 text-sm font-semibold transition-colors ${month === ''
                  ? 'border-amber-300 bg-amber-50 text-amber-800'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                ทุกเดือน
              </button>
              {availableMonths.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onMonthChange(option.value)}
                  className={`rounded-full border px-3 py-2 text-sm font-semibold transition-colors ${month === option.value
                    ? 'border-amber-300 bg-amber-50 text-amber-800'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <label className="mt-4 block text-md font-semibold uppercase tracking-[0.05em] text-gray-600">ช่วงราคา</label>
              <span className="mt-4 text-md font-semibold text-gray-500">
                ฿{minPrice.toLocaleString()} - ฿{maxPrice.toLocaleString()}
              </span>
            </div>
            <div className="rounded-[1.2rem] border border-gray-200 bg-gray-50 px-4 py-4">
              <div className="relative h-8">
                <div className="absolute left-0 top-1/2 h-2 w-full -translate-y-1/2 rounded-full bg-gray-200" />
                <div
                  className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-amber-400"
                  style={{ left: `${leftPercent}%`, right: `${rightPercent}%` }}
                />
                <input
                  type="range"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  step={100}
                  value={minPrice}
                  onChange={(event) => onMinPriceChange(Number(event.target.value))}
                  className="pointer-events-none absolute left-0 top-1/2 h-2 w-full -translate-y-1/2 appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--color-primary)] [&::-webkit-slider-thumb]:shadow-sm"
                />
                <input
                  type="range"
                  min={priceBounds.min}
                  max={priceBounds.max}
                  step={100}
                  value={maxPrice}
                  onChange={(event) => onMaxPriceChange(Number(event.target.value))}
                  className="pointer-events-none absolute left-0 top-1/2 h-2 w-full -translate-y-1/2 appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:shadow-sm"
                />
              </div>
              <div className="mt-4 flex items-center justify-between text-xs font-semibold text-gray-500">
                <span>ต่ำสุด {priceBounds.min.toLocaleString()} บาท</span>
                <span>สูงสุด {priceBounds.max.toLocaleString()} บาท</span>
              </div>
            </div>
          </div>

          <div>
            <label className="mt-3 mb-2 block text-md font-semibold uppercase tracking-[0.05em] text-gray-600">ภาค</label>
            <select
              value={region}
              onChange={(event) => {
                onRegionChange(event.target.value)
                onProvinceChange('')
              }}
              className="ui-focus-ring w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:bg-white"
            >
              <option value="">ทุกภาค</option>
              {REGIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>

          <div>
            <label className="mt-3 mb-2 block text-md font-semibold uppercase tracking-[0.05em] text-gray-600">จังหวัด</label>
            <select
              value={province}
              onChange={(event) => onProvinceChange(event.target.value)}
              className="ui-focus-ring w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:bg-white"
            >
              <option value="">ทุกจังหวัด</option>
              {provinceOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
        </div>
      </div>
    </aside>
  )
}
