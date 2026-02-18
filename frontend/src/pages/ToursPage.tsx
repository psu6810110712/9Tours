import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import TourCard from '../components/TourCard'
import { tourService } from '../services/tourService'
import type { Tour } from '../types/tour'

const REGIONS = ['ภาคเหนือ', 'ภาคกลาง', 'ภาคใต้', 'ภาคตะวันออก', 'ภาคตะวันออกเฉียงเหนือ']

const PROVINCES_BY_REGION: Record<string, string[]> = {
  'ภาคเหนือ': ['เชียงใหม่', 'เชียงราย', 'ลำปาง', 'แม่ฮ่องสอน'],
  'ภาคกลาง': ['กรุงเทพฯ', 'อยุธยา', 'กาญจนบุรี'],
  'ภาคใต้': ['ภูเก็ต', 'กระบี่', 'สุราษฎร์ธานี', 'สงขลา', 'ชุมพร', 'นครศรีธรรมราช'],
  'ภาคตะวันออก': ['ชลบุรี', 'ระยอง', 'จันทบุรี'],
  'ภาคตะวันออกเฉียงเหนือ': ['ขอนแก่น', 'นครราชสีมา', 'อุดรธานี'],
}

const SORT_OPTIONS = [
  { value: 'default', label: 'เรียงตาม: ค่าเริ่มต้น' },
  { value: 'price_asc', label: 'ราคา: ต่ำ → สูง' },
  { value: 'price_desc', label: 'ราคา: สูง → ต่ำ' },
  { value: 'rating', label: 'คะแนนสูงสุด' },
]

export default function ToursPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [allTours, setAllTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)

  // filter state - sync กับ URL params
  const [region, setRegion] = useState(searchParams.get('region') || '')
  const [province, setProvince] = useState(searchParams.get('province') || '')
  const [tourType, setTourType] = useState(searchParams.get('tourType') || '')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [sortBy, setSortBy] = useState('default')

  useEffect(() => {
    setLoading(true)
    tourService
      .getAll({ region: region || undefined, province: province || undefined, tourType: tourType || undefined, search: search || undefined })
      .then(setAllTours)
      .finally(() => setLoading(false))
  }, [region, province, tourType, search])

  // อัปเดต URL เมื่อ filter เปลี่ยน
  useEffect(() => {
    const params: Record<string, string> = {}
    if (region) params.region = region
    if (province) params.province = province
    if (tourType) params.tourType = tourType
    if (search) params.search = search
    setSearchParams(params, { replace: true })
  }, [region, province, tourType, search])

  const sortedTours = [...allTours].sort((a, b) => {
    if (sortBy === 'price_asc') return Number(a.price) - Number(b.price)
    if (sortBy === 'price_desc') return Number(b.price) - Number(a.price)
    if (sortBy === 'rating') return b.rating - a.rating
    return 0
  })

  const clearFilters = () => {
    setRegion(''); setProvince(''); setTourType(''); setSearch('')
  }

  const hasFilter = region || province || tourType || search

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">

        {/* Filter Sidebar */}
        <aside className="w-56 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm p-4 sticky top-20">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-800">ตัวกรอง</h2>
              {hasFilter && (
                <button onClick={clearFilters} className="text-xs text-[#F5A623] hover:underline">
                  ล้างทั้งหมด
                </button>
              )}
            </div>

            {/* ประเภททัวร์ */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">ประเภท</label>
              <div className="space-y-1">
                {[{ value: '', label: 'ทั้งหมด' }, { value: 'one_day', label: 'วันเดย์ทริป' }, { value: 'package', label: 'แพ็คเกจพร้อมที่พัก' }].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTourType(opt.value)}
                    className={`w-full text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${tourType === opt.value ? 'bg-[#F5A623] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ภาค */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">ภาค</label>
              <select
                value={region}
                onChange={(e) => { setRegion(e.target.value); setProvince('') }}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none"
              >
                <option value="">ทุกภาค</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* จังหวัด */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">จังหวัด</label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none"
              >
                <option value="">ทุกจังหวัด</option>
                {(region ? PROVINCES_BY_REGION[region] ?? [] : Object.values(PROVINCES_BY_REGION).flat()).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* ค้นหา */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">ค้นหา</label>
              <input
                type="text"
                placeholder="ชื่อทัวร์..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none"
              />
            </div>
          </div>
        </aside>

        {/* Tour Grid */}
        <main className="flex-1 min-w-0">
          {/* header row */}
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
              {sortedTours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  )
}
