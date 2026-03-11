import { useEffect, useMemo, useState } from 'react'
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

export default function ToursPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('default')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const [region, setRegion] = useState(searchParams.get('region') || '')
  const [province, setProvince] = useState(searchParams.get('province') || '')
  const [tourType, setTourType] = useState(searchParams.get('tourType') || '')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [month, setMonth] = useState(searchParams.get('month') || '')

  useBodyScrollLock(mobileFiltersOpen)

  useEffect(() => {
    setLoading(true)
    tourService
      .getAll({
        region: region || undefined,
        province: province || undefined,
        tourType: tourType || undefined,
        search: search || undefined,
        month: month || undefined,
      })
      .then(setTours)
      .catch((error) => {
        console.error(error)
        setTours([])
      })
      .finally(() => setLoading(false))
  }, [region, province, tourType, search, month])

  useEffect(() => {
    const params: Record<string, string> = {}
    if (region) params.region = region
    if (province) params.province = province
    if (tourType) params.tourType = tourType
    if (search) params.search = search
    if (month) params.month = month
    setSearchParams(params, { replace: true })
  }, [region, province, tourType, search, month, setSearchParams])

  const sortedTours = useMemo(() => {
    return [...tours].sort((a, b) => {
      if (sortBy === 'price_asc') return Number(a.price) - Number(b.price)
      if (sortBy === 'price_desc') return Number(b.price) - Number(a.price)
      if (sortBy === 'rating') return b.rating - a.rating
      return 0
    })
  }, [sortBy, tours])

  const activeFilterCount = [region, province, tourType, search, month].filter(Boolean).length

  const clearFilters = () => {
    setRegion('')
    setProvince('')
    setTourType('')
    setSearch('')
    setMonth('')
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
              <p className="mt-1 text-sm text-gray-500">ค้นหาทัวร์ตามจังหวัด ประเภท และช่วงเดือนที่ต้องการ</p>
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
            month={month}
            onRegionChange={setRegion}
            onProvinceChange={setProvince}
            onTourTypeChange={setTourType}
            onMonthChange={setMonth}
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
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="ui-focus-ring rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[var(--color-primary)] focus:bg-white"
              >
                {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="ui-surface rounded-[1.5rem] px-6 py-20 text-center text-gray-400">กำลังโหลด...</div>
          ) : sortedTours.length === 0 ? (
            <div className="ui-surface rounded-[1.5rem] px-6 py-20 text-center">
              <p className="text-lg font-semibold text-gray-700">ไม่พบทัวร์ที่ตรงกับเงื่อนไข</p>
              <p className="mt-2 text-sm text-gray-400">ลองขยายช่วงเวลา หรือเลือกรายการตัวกรองให้น้อยลง</p>
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
              month={month}
              onRegionChange={setRegion}
              onProvinceChange={setProvince}
              onTourTypeChange={setTourType}
              onMonthChange={setMonth}
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
