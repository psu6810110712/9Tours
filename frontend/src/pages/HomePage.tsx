import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import TourCard from '../components/TourCard'
import { tourService } from '../services/tourService'
import type { Tour } from '../types/tour'

// multi-select category tags — รวมเป็น filter ตอนกดค้นหา
const CATEGORIES = ['สายธรรมชาติ', 'สายคาเฟ่', 'สายกิจกรรม', 'สายมู', 'สายชิล']

// static data — รูปจาก Unsplash, province ใช้เป็น filter ตอนคลิก
const PLACES = [
  { name: 'ทะเลใต้', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400', province: 'ภูเก็ต' },
  { name: 'สุราษฎร์ธานี', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400', province: 'สุราษฎร์ธานี' },
  { name: 'ภูเก็ต', image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=400', province: 'ภูเก็ต' },
  { name: 'เชียงใหม่', image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400', province: 'เชียงใหม่' },
]

export default function HomePage() {
  const [tours, setTours] = useState<Tour[]>([])
  const [search, setSearch] = useState('')
  const [tourType, setTourType] = useState<'' | 'one_day' | 'package'>('')
  const [guests, setGuests] = useState(2)
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set())
  const navigate = useNavigate()

  useEffect(() => {
    tourService.getAll().then(setTours).catch(console.error)
  }, [])

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* ===== Hero — rounded card ไม่เต็มจอ ===== */}
      <div className="max-w-7xl mx-auto px-8 pt-6">
        <section
          className="relative rounded-3xl overflow-hidden"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black/40" />

          <div className="relative z-10 text-center text-white px-6 py-14">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              คุณพัณวดีอยากเที่ยวที่ไหนดี?
            </h1>
            <p className="text-base mb-8 text-white/80">
              เที่ยวทั่วไทย ราคาโดนใจ เลือกทริปที่ใช่ จองได้ทันที
            </p>

            {/* Tour Type Toggle — signature ของ 9Tours */}
            <div className="flex justify-center gap-3 mb-5">
              <button
                onClick={() => setTourType(tourType === 'one_day' ? '' : 'one_day')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  tourType === 'one_day'
                    ? 'bg-[var(--color-accent)] text-white shadow-lg'
                    : 'bg-white/15 text-white border border-white/30 backdrop-blur-sm hover:bg-white/25'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7h-3V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM9 5h6v2H9V5z" />
                </svg>
                วันเดย์ทริปทั่วไทย
              </button>
              <button
                onClick={() => setTourType(tourType === 'package' ? '' : 'package')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  tourType === 'package'
                    ? 'bg-[var(--color-accent)] text-white shadow-lg'
                    : 'bg-white/15 text-white border border-white/30 backdrop-blur-sm hover:bg-white/25'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M5 21H3m4-10h1m4 0h1m-5 4h1m4 0h1" />
                </svg>
                เที่ยวหลายวันพร้อมที่พัก
              </button>
            </div>

            {/* Search Bar — rounded-2xl, search icon + input + person counter + ค้นหา */}
            <div className="bg-white rounded-2xl shadow-lg p-2 flex items-center gap-1 max-w-2xl mx-auto">
              {/* search icon + input */}
              <div className="flex items-center gap-2 flex-1 min-w-0 pl-3">
                <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  placeholder="ค้นหาทัวร์หรือสถานที่..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 py-2.5 text-gray-800 text-sm outline-none bg-transparent min-w-0"
                />
              </div>

              <div className="w-px h-7 bg-gray-200 flex-shrink-0" />

              {/* person counter */}
              <div className="flex items-center gap-1.5 px-3 flex-shrink-0">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="text-sm text-gray-700 bg-transparent outline-none font-medium"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>x{n}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSearch}
                className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors flex-shrink-0"
              >
                ค้นหา
              </button>
            </div>

            {/* Category chips — multi-select ใต้ search bar */}
            <div className="flex justify-center gap-2 mt-4 max-w-2xl mx-auto flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm transition-all ${
                    selectedCats.has(cat)
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
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">สถานที่ที่คุณอาจชอบ</h2>
            <Link to="/tours" className="text-sm text-gray-400 hover:text-[var(--color-primary)] transition-colors">
              ดูทั้งหมด →
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {PLACES.map((place) => (
              <button
                key={place.name}
                onClick={() => navigate(`/tours?province=${place.province}`)}
                className="group relative h-36 rounded-xl overflow-hidden text-left"
              >
                <img
                  src={place.image}
                  alt={place.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-3 left-3 text-white font-semibold text-sm">
                  {place.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* --- ที่เที่ยวยอดนิยมห้ามพลาด --- */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">ที่เที่ยวยอดนิยมห้ามพลาด</h2>
            <Link to="/tours" className="text-sm text-gray-400 hover:text-[var(--color-primary)] transition-colors">
              ดูทั้งหมด →
            </Link>
          </div>
          {tours.length === 0 ? (
            <div className="text-center py-12 text-gray-400">กำลังโหลด...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tours.map((tour) => <TourCard key={tour.id} tour={tour} />)}
            </div>
          )}
        </section>
      </div>

      <Footer />
    </div>
  )
}
