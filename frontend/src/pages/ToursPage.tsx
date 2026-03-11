import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import TourCard from '../components/TourCard'
import SearchBar from '../components/common/SearchBar'
import FilterSidebar from '../components/tour/FilterSidebar'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { tourService } from '../services/tourService'
import type { Tour } from '../types/tour'

const SORT_OPTIONS = [
  { value: 'default', label: 'เรียงตาม: ค่าเริ่มต้น' },
  { value: 'price_asc', label: 'ราคา: ต่ำ → สูง' },
  { value: 'price_desc', label: 'ราคา: สูง → ต่ำ' },
  { value: 'rating', label: 'คะแนนสูงสุด' },
]

function parseDelimitedParam(value: string | null) {
  if (!value) return []
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

function parseNumberParam(value: string | null) {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function formatMonthLabel(monthValue: string) {
  const date = new Date(`${monthValue}-01T00:00:00`)
  if (Number.isNaN(date.getTime())) return monthValue
  return date.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })
}

export default function ToursPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [allTours, setAllTours] = useState<Tour[]>([])
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('default')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [sortMenuOpen, setSortMenuOpen] = useState(false)
  const sortMenuRef = useRef<HTMLDivElement>(null)

  const [region, setRegion] = useState(searchParams.get('region') || '')
  const [province, setProvince] = useState(searchParams.get('province') || '')
  const [tourType, setTourType] = useState(searchParams.get('tourType') || '')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [month, setMonth] = useState(searchParams.get('month') || '')
  const [categories, setCategories] = useState<string[]>(() => parseDelimitedParam(searchParams.get('categories')))
  const [minPrice, setMinPrice] = useState<number | undefined>(() => parseNumberParam(searchParams.get('minPrice')))
  const [maxPrice, setMaxPrice] = useState<number | undefined>(() => parseNumberParam(searchParams.get('maxPrice')))

  useBodyScrollLock(mobileFiltersOpen)

  useEffect(() => {
    tourService.getAll()
      .then(setAllTours)
      .catch(() => setAllTours([]))
  }, [])

  useEffect(() => {
    setRegion(searchParams.get('region') || '')
    setProvince(searchParams.get('province') || '')
    setTourType(searchParams.get('tourType') || '')
    setSearch(searchParams.get('search') || '')
    setMonth(searchParams.get('month') || '')
    setCategories(parseDelimitedParam(searchParams.get('categories')))
    setMinPrice(parseNumberParam(searchParams.get('minPrice')))
    setMaxPrice(parseNumberParam(searchParams.get('maxPrice')))
  }, [searchParams])

  const priceBounds = useMemo(() => {
    if (allTours.length === 0) {
      return { min: 0, max: 10000 }
    }

    const prices = allTours
      .map((tour) => Number(tour.price))
      .filter((price) => Number.isFinite(price))

    const min = Math.min(...prices)
    const max = Math.max(...prices)
    return { min, max: Math.max(min, max) }
  }, [allTours])

  useEffect(() => {
    setMinPrice((prev) => {
      if (typeof prev !== 'number') return priceBounds.min
      return Math.min(Math.max(prev, priceBounds.min), maxPrice ?? priceBounds.max)
    })

    setMaxPrice((prev) => {
      if (typeof prev !== 'number') return priceBounds.max
      return Math.max(Math.min(prev, priceBounds.max), minPrice ?? priceBounds.min)
    })
  }, [maxPrice, minPrice, priceBounds.max, priceBounds.min])

  useEffect(() => {
    if (typeof minPrice !== 'number' || typeof maxPrice !== 'number') return

    setLoading(true)
    tourService
      .getAll({
        region: region || undefined,
        province: province || undefined,
        tourType: tourType || undefined,
        search: search || undefined,
        month: month || undefined,
        categories: categories.length > 0 ? categories : undefined,
        minPrice,
        maxPrice,
      })
      .then(setTours)
      .catch((error) => {
        console.error(error)
        setTours([])
      })
      .finally(() => setLoading(false))
  }, [categories, maxPrice, minPrice, month, province, region, search, tourType])

  useEffect(() => {
    if (typeof minPrice !== 'number' || typeof maxPrice !== 'number') return

    const params = new URLSearchParams()
    if (region) params.set('region', region)
    if (province) params.set('province', province)
    if (tourType) params.set('tourType', tourType)
    if (search) params.set('search', search)
    if (month) params.set('month', month)
    if (categories.length > 0) params.set('categories', categories.join(','))
    if (minPrice > priceBounds.min) params.set('minPrice', String(minPrice))
    if (maxPrice < priceBounds.max) params.set('maxPrice', String(maxPrice))
    setSearchParams(params, { replace: true })
  }, [categories, maxPrice, minPrice, month, priceBounds.max, priceBounds.min, province, region, search, setSearchParams, tourType])

  useEffect(() => {
    if (!sortMenuOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!sortMenuRef.current?.contains(event.target as Node)) {
        setSortMenuOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSortMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [sortMenuOpen])

  const sortedTours = useMemo(() => {
    return [...tours].sort((a, b) => {
      if (sortBy === 'price_asc') return Number(a.price) - Number(b.price)
      if (sortBy === 'price_desc') return Number(b.price) - Number(a.price)
      if (sortBy === 'rating') return b.rating - a.rating
      return 0
    })
  }, [sortBy, tours])

  const availableCategories = useMemo(() => {
    return Array.from(new Set(allTours.flatMap((tour) => tour.categories))).sort((a, b) => a.localeCompare(b, 'th'))
  }, [allTours])

  const availableMonths = useMemo(() => {
    const months = new Set<string>()
    allTours.forEach((tour) => {
      tour.schedules.forEach((schedule) => {
        if (schedule.startDate) {
          months.add(schedule.startDate.slice(0, 7))
        }
      })
    })

    return Array.from(months)
      .sort()
      .map((value) => ({ value, label: formatMonthLabel(value) }))
  }, [allTours])

  const activeFilterCount = [
    region,
    province,
    tourType,
    search.trim(),
    month,
    categories.length > 0 ? 'categories' : '',
    typeof minPrice === 'number' && minPrice > priceBounds.min ? 'minPrice' : '',
    typeof maxPrice === 'number' && maxPrice < priceBounds.max ? 'maxPrice' : '',
  ].filter(Boolean).length

  const selectedSortLabel = SORT_OPTIONS.find((option) => option.value === sortBy)?.label ?? SORT_OPTIONS[0].label

  const toggleCategory = (category: string) => {
    setCategories((prev) => (
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category]
    ))
  }

  const clearFilters = () => {
    setRegion('')
    setProvince('')
    setTourType('')
    setSearch('')
    setMonth('')
    setCategories([])
    setMinPrice(priceBounds.min)
    setMaxPrice(priceBounds.max)
  }

  const handleMinPriceChange = (value: number) => {
    setMinPrice(Math.min(value, maxPrice ?? priceBounds.max))
  }

  const handleMaxPriceChange = (value: number) => {
    setMaxPrice(Math.max(value, minPrice ?? priceBounds.min))
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] bg-[linear-gradient(135deg,#f8fafc,#eef4ff)] px-4 py-6 sm:px-6">
          <SearchBar
            search={search}
            setSearch={setSearch}
            guests={1}
            setGuests={() => undefined}
            onSearch={() => undefined}
            showGuests={false}
          />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">รวมทัวร์ทั้งหมด</h1>
              <p className="mt-1 text-sm text-gray-500">ค้นหาทัวร์ตามจังหวัด ประเภท หมวดหมู่ เดือน และช่วงราคาที่ต้องการ</p>
            </div>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="ui-focus-ring ui-pressable inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 lg:hidden"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707L14 14v5l-4 2v-7L3.293 6.293A1 1 0 013 5.586V4z" />
              </svg>
              ตัวกรอง {activeFilterCount > 0 && <span className="rounded-full bg-[var(--color-primary-light)] px-2 py-0.5 text-xs text-[var(--color-primary)]">{activeFilterCount}</span>}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="hidden lg:block">
          <FilterSidebar
            region={region}
            province={province}
            tourType={tourType}
            search={search}
            categories={categories}
            month={month}
            minPrice={minPrice ?? priceBounds.min}
            maxPrice={maxPrice ?? priceBounds.max}
            priceBounds={priceBounds}
            availableCategories={availableCategories}
            availableMonths={availableMonths}
            onRegionChange={setRegion}
            onProvinceChange={setProvince}
            onTourTypeChange={setTourType}
            onCategoryToggle={toggleCategory}
            onMonthChange={setMonth}
            onMinPriceChange={handleMinPriceChange}
            onMaxPriceChange={handleMaxPriceChange}
            onClear={clearFilters}
          />
        </div>

        <main className="min-w-0 flex-1">
          <div className="mb-5 flex flex-col gap-3 rounded-[1.5rem] border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">
                {loading ? 'กำลังโหลดรายการทัวร์...' : `พบทัวร์ ${sortedTours.length} รายการ`}
              </p>
              {activeFilterCount > 0 && !loading && (
                <p className="mt-1 text-xs text-gray-400">กำลังแสดงผลตามตัวกรองที่เลือก</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {activeFilterCount > 0 && (
                <button type="button" onClick={clearFilters} className="text-sm font-medium text-accent hover:underline">
                  ล้างตัวกรอง
                </button>
              )}
              <div ref={sortMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setSortMenuOpen((prev) => !prev)}
                  className="ui-focus-ring inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-white"
                  aria-haspopup="listbox"
                  aria-expanded={sortMenuOpen}
                >
                  <span>{selectedSortLabel}</span>
                  <svg className={`h-4 w-4 text-gray-500 transition-transform ${sortMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {sortMenuOpen && (
                  <div className="ui-pop absolute right-0 top-[calc(100%+0.5rem)] z-20 min-w-[220px] rounded-[1.2rem] border border-gray-200 bg-white p-2 shadow-[0_20px_40px_rgba(15,23,42,0.14)]">
                    <div role="listbox" aria-label="เรียงลำดับทัวร์" className="space-y-1">
                      {SORT_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setSortBy(option.value)
                            setSortMenuOpen(false)
                          }}
                          className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${sortBy === option.value
                            ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <span>{option.label}</span>
                          {sortBy === option.value && (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="ui-surface rounded-[1.5rem] px-6 py-20 text-center text-gray-400">กำลังโหลด...</div>
          ) : sortedTours.length === 0 ? (
            <div className="ui-surface rounded-[1.5rem] px-6 py-20 text-center">
              <p className="text-lg font-semibold text-gray-700">ไม่พบทัวร์ที่ตรงกับเงื่อนไข</p>
              <p className="mt-2 text-sm text-gray-400">ลองขยายช่วงราคา เปลี่ยนเดือน หรือเลือกตัวกรองให้น้อยลง</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {sortedTours.map((tour) => <TourCard key={tour.id} tour={tour} />)}
            </div>
          )}
        </main>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-[var(--z-drawer)] lg:hidden">
          <button
            type="button"
            aria-label="ปิดตัวกรอง"
            className="ui-overlay absolute inset-0"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute inset-x-4 bottom-4 top-4 overflow-y-auto">
            <FilterSidebar
              region={region}
              province={province}
              tourType={tourType}
              search={search}
              categories={categories}
              month={month}
              minPrice={minPrice ?? priceBounds.min}
              maxPrice={maxPrice ?? priceBounds.max}
              priceBounds={priceBounds}
              availableCategories={availableCategories}
              availableMonths={availableMonths}
              onRegionChange={setRegion}
              onProvinceChange={setProvince}
              onTourTypeChange={setTourType}
              onCategoryToggle={toggleCategory}
              onMonthChange={setMonth}
              onMinPriceChange={handleMinPriceChange}
              onMaxPriceChange={handleMaxPriceChange}
              onClear={clearFilters}
              mode="drawer"
              onClose={() => setMobileFiltersOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  )
}
