import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import TourCard from '../components/TourCard'
import { tourService } from '../services/tourService'
import type { Tour } from '../types/tour'

// categories ผูกกับ tourType param เพื่อกรองใน ToursPage
// "วันเดย์ทริป" → tourType=one_day, "เที่ยวพร้อมที่พัก" → tourType=package
// อื่นๆ → ใช้ search param แทน
const CATEGORIES = ['ธรรมชาติ', 'วันเดย์ทริป', 'เที่ยวพร้อมที่พัก', 'สายมู', 'สายชิล']

// static data — รูปจาก Unsplash, province ใช้เป็น filter ตอนคลิก
const PLACES = [
  { name: 'ทะเลใต้', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400', province: 'ภูเก็ต' },
  { name: 'สุราษฎร์ธานี', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400', province: 'สุราษฎร์ธานี' },
  { name: 'ภูเก็ต', image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=400', province: 'ภูเก็ต' },
  { name: 'เชียงใหม่', image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400', province: 'เชียงใหม่' },
]

// ภาค dropdown สำหรับ search bar — map ไปเป็น region param
const REGIONS = ['ภาคเหนือ', 'ภาคกลาง', 'ภาคใต้', 'ภาคตะวันออก', 'ภาคตะวันออกเฉียงเหนือ']

export default function HomePage() {
  const [tours, setTours] = useState<Tour[]>([])
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    tourService.getAll().then(setTours).catch(console.error)
  }, [])

  // รวม search + region แล้ว navigate ไป ToursPage พร้อม query params
  const handleSearch = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (region) params.set('region', region)
    navigate(`/tours?${params.toString()}`)
  }

  const handleCategoryClick = (cat: string) => {
    if (cat === 'วันเดย์ทริป') navigate('/tours?tourType=one_day')
    else if (cat === 'เที่ยวพร้อมที่พัก') navigate('/tours?tourType=package')
    else navigate(`/tours?search=${cat}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* ===== Hero Section ===== */}
      {/* hero height 500px เพื่อให้ search + category chips ใส่ได้พอดี */}
      <section
        className="relative h-[500px] flex items-center justify-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/45" />

        <div className="relative z-10 text-center text-white px-4 w-full max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            คุณพัณวดีอยากเที่ยวที่ไหนดี?
          </h1>
          <p className="text-base mb-8 text-white/80">
            เที่ยวทั่วไทย ราคาโดนใจ เลือกทริปที่ใช่ จองได้ทุกที่
          </p>

          {/* Search Bar — ภาค dropdown + text input + ค้นหา */}
          <div className="bg-white rounded-xl shadow-lg p-2 flex items-center gap-1">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="px-3 py-2.5 text-gray-600 text-sm rounded-lg outline-none bg-white border-r border-gray-200"
            >
              <option value="">ทุกภาค</option>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <input
              type="text"
              placeholder="ค้นหาทัวร์หรือสถานที่..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-3 py-2.5 text-gray-800 text-sm outline-none min-w-0"
            />
            <button
              onClick={handleSearch}
              className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)] text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors flex-shrink-0"
            >
              ค้นหา
            </button>
          </div>

          {/* Category chips — อยู่ใน hero ใต้ search bar */}
          <div className="flex justify-center gap-2 mt-5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm border border-white/30 hover:bg-white/40 transition-colors"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

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
