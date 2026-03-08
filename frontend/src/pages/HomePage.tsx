import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TourCard from '../components/TourCard'
import { tourService } from '../services/tourService'
import type { Tour } from '../types/tour'
import SearchBar from '../components/common/SearchBar'
import { useAuth } from '../context/AuthContext'

// multi-select category tags — รวมเป็น filter ตอนกดค้นหา
const CATEGORIES = ['สายธรรมชาติ', 'สายคาเฟ่', 'สายกิจกรรม', 'สายมู', 'สายชิล']

// places — province: null = แสดงทัวร์ทั้งหมด (ที่ไหนก็ได้)
const PLACES = [
  { name: 'ที่ไหนก็ได้', image: '/images/anywhere-2.png', province: null as string | null },
  { name: 'สุราษฎร์ธานี', image: '/images/anywhere-1.png', province: 'สุราษฎร์ธานี' },
  { name: 'ภูเก็ต', image: '/images/anywhere-4.png', province: 'ภูเก็ต' },
  { name: 'เชียงใหม่', image: '/images/anywhere-3.png', province: 'เชียงใหม่' },
]

type Place = typeof PLACES[0]

export default function HomePage() {
  const { user } = useAuth()
  const [tours, setTours] = useState<Tour[]>([])
  const [toursLoading, setToursLoading] = useState(true)
  const [recommendedTours, setRecommendedTours] = useState<Tour[]>([])
  const [recommendationLoading, setRecommendationLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [tourType, setTourType] = useState<'' | 'one_day' | 'package'>('')
  const [guests, setGuests] = useState(2)
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set())
  // selectedPlace — default "ที่ไหนก็ได้" แสดงทัวร์ทั้งหมด
  const [selectedPlace, setSelectedPlace] = useState<Place>(PLACES[0])

  const placeScrollRef = useRef<HTMLDivElement>(null)
  const tourScrollRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    tourService.getAll()
      .then(setTours)
      .catch(console.error)
      .finally(() => setToursLoading(false))
  }, [])

  useEffect(() => {
    if (!user) {
      setRecommendedTours([])
      setRecommendationLoading(false)
      return
    }

    setRecommendationLoading(true)
    tourService.getRecommendations(8)
      .then((items) => setRecommendedTours(items))
      .catch(() => {
        // fallback ให้หน้าแรกไม่ว่าง กรณี endpoint มีปัญหา
        setRecommendedTours(tours.slice(0, 8))
      })
      .finally(() => setRecommendationLoading(false))
  }, [user, tours])

  const toggleCategory = (cat: string) => {
    setSelectedCats((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  // รวมทุก filter → navigate ไป ToursPage
  const handleSearch = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (tourType) params.set('tourType', tourType)
    if (selectedCats.size > 0) {
      const catSearch = [...selectedCats].join(' ')
      params.set('search', search ? `${search} ${catSearch}` : catSearch)
    }
    navigate(`/tours?${params.toString()}`)
  }

  // กรองทัวร์ตาม province ที่เลือก, null = ทั้งหมด
  const displayedTours = selectedPlace.province
    ? tours.filter(t => t.province === selectedPlace.province)
    : tours

  // หัวข้อ section เปลี่ยนตาม province ที่เลือก
  const sectionTitle = selectedPlace.province
    ? `ที่เที่ยวยอดนิยมห้ามพลาดใน${selectedPlace.name}`
    : 'ที่เที่ยวยอดนิยมห้ามพลาด'

  return (
    <>
      {/* ===== Hero — rounded card ไม่เต็มจอ ===== */}
      <div className="max-w-7xl mx-auto px-8 pt-6">
        <section
          className="relative rounded-3xl overflow-hidden"
          style={{ backgroundImage: 'url(/hero-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="absolute inset-0 bg-black/40" />

          <div className="relative z-10 text-center text-white px-6 py-14">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">มีสถานที่ในใจแล้วหรือยัง?</h1>
            <p className="text-base mb-8 text-white/80">เที่ยวทั่วไทย ราคาโดนใจ เลือกทริปที่ใช่ จองได้ทันที</p>

            {/* Tour Type Slider — pill วิ่งซ้าย-ขวา */}
            <div className="flex justify-center mb-5">
              <div className="relative inline-grid grid-cols-2 bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/20">
                {/* sliding pill */}
                <div
                  className="absolute inset-y-1 rounded-full bg-[var(--color-accent)] shadow-md transition-all duration-300 ease-[cubic-bezier(.4,0,.2,1)]"
                  style={{
                    width: 'calc(50% - 4px)',
                    left: tourType === 'package' ? 'calc(50% + 2px)' : '4px',
                    opacity: tourType ? 1 : 0,
                  }}
                />
                <button
                  onClick={() => setTourType(tourType === 'one_day' ? '' : 'one_day')}
                  className={`relative z-10 flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold transition-colors duration-200 ${tourType === 'one_day' ? 'text-white' : 'text-white/60 hover:text-white/90'
                    }`}
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <rect x="2" y="7" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l1.5 1.5L14 12" />
                  </svg>
                  วันเดย์ทริป
                </button>
                <button
                  onClick={() => setTourType(tourType === 'package' ? '' : 'package')}
                  className={`relative z-10 flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold transition-colors duration-200 ${tourType === 'package' ? 'text-white' : 'text-white/60 hover:text-white/90'
                    }`}
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  แพ็คเกจพร้อมที่พัก
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <SearchBar
              search={search}
              setSearch={setSearch}
              guests={guests}
              setGuests={setGuests}
              onSearch={handleSearch}
            />

            {/* Category chips — multi-select */}
            <div className="flex justify-center gap-2 mt-4 max-w-2xl mx-auto flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm transition-all ${selectedCats.has(cat)
                    ? 'bg-[var(--color-accent)] text-white font-semibold shadow-sm'
                    : 'bg-white/90 text-gray-600 hover:bg-white hover:text-gray-800'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ===== Content Area ===== */}
      <div className="max-w-7xl mx-auto px-8 py-10">

        {/* --- สถานที่ที่คุณอาจชอบ --- */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">สถานที่ที่คุณอาจชอบ</h2>
          <div className="relative">
            {/* horizontal scroll — กด card เพื่อ filter ทัวร์ด้านล่าง */}
            <div ref={placeScrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
              {PLACES.map((place) => (
                <button
                  key={place.name}
                  onClick={() => setSelectedPlace(place)}
                  className={`group relative flex-shrink-0 w-56 h-36 rounded-xl overflow-hidden text-left transition-all duration-200 ${selectedPlace.name === place.name
                    ? 'ring-2 ring-[var(--color-primary)] ring-offset-2'
                    : 'opacity-80 hover:opacity-100'
                    }`}
                >
                  <img
                    src={place.image}
                    alt={place.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-3 left-3 text-white font-semibold text-sm">{place.name}</span>
                </button>
              ))}
            </div>
            {/* ลูกศรขวา — scroll place cards */}
            <button
              onClick={() => placeScrollRef.current?.scrollBy({ left: 280, behavior: 'smooth' })}
              className="absolute -right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center shadow-lg z-10 text-lg"
            >
              →
            </button>
          </div>
        </section>

        {/* --- ทัวร์แนะนำส่วนบุคคล (เฉพาะผู้ใช้ที่ล็อกอิน) --- */}
        {user && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">ทริปที่คุณอาจชอบ</h2>
              <Link to="/tours" className="text-sm text-gray-400 hover:text-[var(--color-primary)] transition-colors">
                ดูทั้งหมด →
              </Link>
            </div>

            {recommendationLoading ? (
              <div className="text-center py-8 text-gray-400">กำลังจัดอันดับทัวร์ที่เหมาะกับคุณ...</div>
            ) : recommendedTours.length === 0 ? (
              <div className="text-center py-8 text-gray-400">ยังไม่มีข้อมูลเพียงพอสำหรับคำแนะนำส่วนตัว</div>
            ) : (
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                {recommendedTours.map((tour) => (
                  <div key={tour.id} className="flex-shrink-0 w-64">
                    <TourCard tour={tour} />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* --- ทัวร์ตาม province ที่เลือก / ทั้งหมด --- */}
        <section>
          <div className="flex items-center justify-between mb-4">
            {/* title เปลี่ยนตามจังหวัดที่เลือก */}
            <h2 className="text-xl font-bold text-gray-800">{sectionTitle}</h2>
            <Link
              to={selectedPlace.province ? `/tours?province=${selectedPlace.province}` : '/tours'}
              className="text-sm text-gray-400 hover:text-[var(--color-primary)] transition-colors"
            >
              ดูทั้งหมด →
            </Link>
          </div>

          {toursLoading ? (
            <div className="text-center py-12 text-gray-400">กำลังโหลด...</div>
          ) : displayedTours.length === 0 ? (
            <div className="text-center py-12 text-gray-400">ยังไม่มีทัวร์ใน{selectedPlace.name}</div>
          ) : (
            <div className="relative">
              {/* horizontal scroll — แสดงทัวร์ตาม province */}
              <div ref={tourScrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                {displayedTours.map((tour) => (
                  <div key={tour.id} className="flex-shrink-0 w-64">
                    <TourCard tour={tour} />
                  </div>
                ))}
              </div>
              {/* ลูกศรขวา — scroll tour cards */}
              <button
                onClick={() => tourScrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
                className="absolute -right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-[var(--color-primary)] text-white rounded-full flex items-center justify-center shadow-lg text-lg"
              >
                →
              </button>
            </div>
          )}
        </section>

      </div>
    </>
  )
}
