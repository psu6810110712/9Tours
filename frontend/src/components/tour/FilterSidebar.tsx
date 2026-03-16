import { useEffect, useMemo, useRef, useState } from 'react'

interface MonthOption {
  value: string
  label: string
}

const CATEGORY_VISIBLE_COUNT = 4

const REGIONS = ['ภาคเหนือ', 'ภาคกลาง', 'ภาคใต้', 'ภาคตะวันออก', 'ภาคตะวันออกเฉียงเหนือ']

const PROVINCES_BY_REGION: Record<string, string[]> = {
  ภาคเหนือ: ['เชียงใหม่', 'เชียงราย', 'ลำปาง', 'แม่ฮ่องสอน'],
  ภาคกลาง: ['กรุงเทพฯ', 'อยุธยา', 'กาญจนบุรี'],
  ภาคใต้: ['ภูเก็ต', 'กระบี่', 'สุราษฎร์ธานี', 'สงขลา', 'ชุมพร', 'นครศรีธรรมราช'],
  ภาคตะวันออก: ['ชลบุรี', 'ระยอง', 'จันทบุรี'],
  ภาคตะวันออกเฉียงเหนือ: ['ขอนแก่น', 'นครราชสีมา', 'อุดรธานี'],
}

interface FilterSidebarProps {
  region: string
  province: string
  tourType: string
  search: string
  categories: string[]
  year: string
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
  onYearChange: (value: string) => void
  onMonthChange: (value: string) => void
  onMinPriceChange: (value: number) => void
  onMaxPriceChange: (value: number) => void
  onClear: () => void
  mode?: 'sidebar' | 'drawer'
  onClose?: () => void
}

function CustomSelect({
  value,
  placeholder,
  options,
  onChange,
  disabled = false,
}: {
  value: string
  placeholder: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedLabel = options.find((option) => option.value === value)?.label ?? placeholder

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          if (!disabled) setOpen((prev) => !prev)
        }}
        disabled={disabled}
        className="ui-focus-ring flex h-12 w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 text-left text-sm font-medium text-gray-700 outline-none transition-colors hover:border-gray-300 focus:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
      >
        <span className="truncate">{selectedLabel}</span>
        <span className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
          <div className="max-h-64 overflow-y-auto py-2">
            {options.map((option) => {
              const active = option.value === value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                    active ? 'bg-[var(--color-primary)] text-white' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function SearchableSelect({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string
  placeholder: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedLabel = options.find((option) => option.value === value)?.label ?? placeholder
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return options
    return options.filter((option) => option.label.toLowerCase().includes(normalizedQuery))
  }, [options, query])

  useEffect(() => {
    if (!open) {
      setQuery('')
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="ui-focus-ring flex h-12 w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 text-left text-sm font-medium text-gray-700 outline-none transition-colors hover:border-gray-300 focus:border-[var(--color-primary)]"
      >
        <span className="truncate">{selectedLabel}</span>
        <span className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.12)]">
          <div className="border-b border-gray-100 p-3">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="พิมพ์ค้นหาจังหวัด"
              autoFocus
              className="ui-focus-ring h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 outline-none transition-colors focus:border-[var(--color-primary)]"
            />
          </div>

          <div className="max-h-64 overflow-y-auto py-2">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const active = option.value === value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value)
                      setOpen(false)
                    }}
                    className={`flex w-full items-center px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                      active ? 'bg-[var(--color-primary)] text-white' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                )
              })
            ) : (
              <div className="px-4 py-3 text-sm font-medium text-gray-400">ไม่พบจังหวัดที่ตรงกัน</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function FilterSidebar({
  region,
  province,
  tourType,
  search,
  categories,
  year,
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
  onYearChange,
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
  const [minPriceInput, setMinPriceInput] = useState(String(minPrice))
  const [maxPriceInput, setMaxPriceInput] = useState(String(maxPrice))

  const sortedCategories = useMemo(() => {
    return [...availableCategories].sort((a, b) => {
      const aSelected = categories.includes(a) ? 0 : 1
      const bSelected = categories.includes(b) ? 0 : 1
      return aSelected - bSelected
    })
  }, [availableCategories, categories])

  const hasMoreCategories = sortedCategories.length > CATEGORY_VISIBLE_COUNT
  const visibleCategories = showAllCategories
    ? sortedCategories
    : sortedCategories.slice(0, CATEGORY_VISIBLE_COUNT)
  const hiddenCount = Math.max(0, sortedCategories.length - CATEGORY_VISIBLE_COUNT)

  const isDrawer = mode === 'drawer'
  const priceRange = Math.max(1, priceBounds.max - priceBounds.min)
  const leftPercent = ((minPrice - priceBounds.min) / priceRange) * 100
  const rightPercent = 100 - (((maxPrice - priceBounds.min) / priceRange) * 100)

  useEffect(() => {
    setMinPriceInput(String(minPrice))
  }, [minPrice])

  useEffect(() => {
    setMaxPriceInput(String(maxPrice))
  }, [maxPrice])

  const clearSelectedCategories = () => {
    categories.forEach((category) => onCategoryToggle(category))
  }

  const selectedYear = year || (month.includes('-') ? month.slice(0, 4) : '')
  const selectedMonthNumber = month.includes('-') ? month.slice(5, 7) : month

  const availableYears = useMemo(() => {
    return Array.from(new Set(availableMonths.map((option) => option.value.slice(0, 4)))).sort()
  }, [availableMonths])

  const availableMonthNumbers = useMemo(() => {
    const map = new Map<string, string>()

    availableMonths.forEach((option) => {
      const monthNumber = option.value.slice(5, 7)
      const label = option.label.replace(/\s+\d{4}$/, '')
      if (!map.has(monthNumber)) {
        map.set(monthNumber, label)
      }
    })

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([value, label]) => ({ value, label }))
  }, [availableMonths])

  const handleYearChange = (nextYear: string) => {
    onYearChange(nextYear)
  }

  const handleMonthNumberChange = (monthNumber: string) => {
    if (!monthNumber) {
      onMonthChange('')
      return
    }

    onMonthChange(selectedYear ? `${selectedYear}-${monthNumber}` : monthNumber)
  }

  const commitMinPriceInput = () => {
    const numeric = Number(minPriceInput.replace(/[^\d]/g, ''))
    if (!Number.isFinite(numeric)) {
      setMinPriceInput(String(minPrice))
      return
    }

    const nextMin = Math.min(Math.max(numeric, priceBounds.min), maxPrice)
    onMinPriceChange(nextMin)
  }

  const commitMaxPriceInput = () => {
    const numeric = Number(maxPriceInput.replace(/[^\d]/g, ''))
    if (!Number.isFinite(numeric)) {
      setMaxPriceInput(String(maxPrice))
      return
    }

    const nextMax = Math.max(Math.min(numeric, priceBounds.max), minPrice)
    onMaxPriceChange(nextMax)
  }

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
                ×
              </button>
            )}
          </div>
        </div>

        <div className="space-y-0 [&>div:not(:first-child)]:border-t [&>div:not(:first-child)]:border-gray-100 [&>div:not(:first-child)]:pt-5 [&>div:not(:last-child)]:pb-5">
          <div>
            <label className="mb-2 block text-md font-semibold uppercase tracking-[0.05em] text-gray-600">ประเภท</label>
            {(() => {
              const tourTypeOptions = [
                { value: '', label: 'ทั้งหมด' },
                { value: 'one_day', label: 'วันเดย์ทริป' },
                { value: 'package', label: 'แพ็กเกจ' },
              ]
              const activeIndex = tourTypeOptions.findIndex((option) => option.value === tourType)
              const count = tourTypeOptions.length

              return (
                <div className="relative flex rounded-full border border-gray-200 bg-gray-100 p-1">
                  <div
                    className="absolute bottom-1 top-1 rounded-full shadow-sm transition-all duration-300 ease-in-out"
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
                      className={`relative z-10 flex-1 rounded-full px-2 py-2 text-center text-sm font-semibold transition-colors duration-300 ${
                        tourType === option.value ? 'text-white' : 'text-gray-500 hover:text-gray-700'
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
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-500">
                  {categories.length > 0 ? `เลือกไว้ ${categories.length} หมวด` : 'เลือกได้หลายหมวดพร้อมกัน'}
                </p>
                {categories.length > 0 && (
                  <button
                    type="button"
                    onClick={clearSelectedCategories}
                    className="text-xs font-semibold text-[var(--color-primary)] hover:underline"
                  >
                    ล้างที่เลือก
                  </button>
                )}
              </div>

              <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
                {visibleCategories.map((category) => {
                  const isSelected = categories.includes(category)
                  return (
                    <label
                      key={category}
                      className="flex min-w-0 cursor-pointer items-center gap-3 rounded-xl px-1 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onCategoryToggle(category)}
                        className="h-4 w-4 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                      />
                      <span className="truncate">{category}</span>
                    </label>
                  )
                })}
              </div>

              {hasMoreCategories && (
                <button
                  type="button"
                  onClick={() => setShowAllCategories((prev) => !prev)}
                  className="flex w-full items-center justify-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
                >
                  {showAllCategories ? '▲ แสดงน้อยลง' : `▼ ดูเพิ่มอีก ${hiddenCount} หมวด`}
                </button>
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="block text-md font-semibold uppercase tracking-[0.05em] text-gray-600">เดือนที่เดินทาง</label>
              {month && (
                <button type="button" onClick={() => onMonthChange('')} className="text-xs font-semibold text-accent hover:underline">
                  ล้าง
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <CustomSelect
                value={selectedMonthNumber}
                placeholder="ทุกเดือน"
                onChange={handleMonthNumberChange}
                options={[
                  { value: '', label: 'ทุกเดือน' },
                  ...availableMonthNumbers,
                ]}
              />

              <CustomSelect
                value={selectedYear}
                placeholder="ทุกปี"
                onChange={handleYearChange}
                options={[
                  { value: '', label: 'ทุกปี' },
                  ...availableYears.map((item) => ({ value: item, label: String(Number(item) + 543) })),
                ]}
              />
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <label className="block text-md font-semibold uppercase tracking-[0.05em] text-gray-600">ช่วงราคา</label>
              <span className="text-md font-semibold text-gray-500">
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

              <div className="mt-4 grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.05em] text-gray-500">ราคาต่ำสุด</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={minPriceInput}
                    onChange={(event) => setMinPriceInput(event.target.value.replace(/[^\d]/g, ''))}
                    onBlur={commitMinPriceInput}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.currentTarget.blur()
                      }
                    }}
                    className="ui-focus-ring h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 outline-none transition-colors focus:border-[var(--color-primary)]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.05em] text-gray-500">ราคาสูงสุด</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={maxPriceInput}
                    onChange={(event) => setMaxPriceInput(event.target.value.replace(/[^\d]/g, ''))}
                    onBlur={commitMaxPriceInput}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.currentTarget.blur()
                      }
                    }}
                    className="ui-focus-ring h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 outline-none transition-colors focus:border-[var(--color-primary)]"
                  />
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-md font-semibold uppercase tracking-[0.05em] text-gray-600">ภาค</label>
            <CustomSelect
              value={region}
              placeholder="ทุกภาค"
              onChange={(value) => {
                onRegionChange(value)
                onProvinceChange('')
              }}
              options={[
                { value: '', label: 'ทุกภาค' },
                ...REGIONS.map((option) => ({ value: option, label: option })),
              ]}
            />
          </div>

          <div>
            <label className="mb-2 block text-md font-semibold uppercase tracking-[0.05em] text-gray-600">จังหวัด</label>
            <SearchableSelect
              value={province}
              placeholder="ทุกจังหวัด"
              onChange={onProvinceChange}
              options={[
                { value: '', label: 'ทุกจังหวัด' },
                ...provinceOptions.map((option) => ({ value: option, label: option })),
              ]}
            />
          </div>
        </div>
      </div>
    </aside>
  )
}
