import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import TourCard from '../components/TourCard'
import FilterSidebar from '../components/tour/FilterSidebar'
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

  const [region, setRegion] = useState(searchParams.get('region') || '')
  const [province, setProvince] = useState(searchParams.get('province') || '')
  const [tourType, setTourType] = useState(searchParams.get('tourType') || '')
  const [search, setSearch] = useState(searchParams.get('search') || '')

  useEffect(() => {
    setLoading(true)
    tourService
      .getAll({
        region: region || undefined,
        province: province || undefined,
        tourType: tourType || undefined,
        search: search || undefined,
      })
      .then(setTours)
      .catch((err) => {
        console.error(err)
        setTours([])
      })
      .finally(() => setLoading(false))
  }, [region, province, tourType, search])

  // sync filter กับ URL
  useEffect(() => {
    const params: Record<string, string> = {}
    if (region) params.region = region
    if (province) params.province = province
    if (tourType) params.tourType = tourType
    if (search) params.search = search
    setSearchParams(params, { replace: true })
  }, [region, province, tourType, search])

  const sortedTours = [...tours].sort((a, b) => {
    if (sortBy === 'price_asc') return Number(a.price) - Number(b.price)
    if (sortBy === 'price_desc') return Number(b.price) - Number(a.price)
    if (sortBy === 'rating') return b.rating - a.rating
    return 0
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        <FilterSidebar
          region={region} province={province} tourType={tourType} search={search}
          onRegionChange={setRegion} onProvinceChange={setProvince}
          onTourTypeChange={setTourType} onSearchChange={setSearch}
          onClear={() => { setRegion(''); setProvince(''); setTourType(''); setSearch('') }}
        />

        <main className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">
              {loading ? 'กำลังโหลด...' : `พบ ${sortedTours.length} รายการ`}
            </p>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none bg-white"
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-400">กำลังโหลด...</div>
          ) : sortedTours.length === 0 ? (
            <div className="text-center py-20 text-gray-400">ไม่พบทัวร์ที่ตรงกับเงื่อนไข</div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedTours.map((tour) => <TourCard key={tour.id} tour={tour} />)}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  )
}
