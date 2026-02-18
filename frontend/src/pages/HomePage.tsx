import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import TourCard from '../components/TourCard'
import { tourService } from '../services/tourService'
import type { Tour } from '../types/tour'

const CATEGORIES = ['ธรรมชาติ', 'วันเดย์ทริป', 'เที่ยวพร้อมที่พัก', 'สายมู', 'สายชิล']

const PLACES = [
  { name: 'ทะเลใต้', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400', province: 'ภูเก็ต' },
  { name: 'สุราษฎร์ธานี', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400', province: 'สุราษฎร์ธานี' },
  { name: 'ภูเก็ต', image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=400', province: 'ภูเก็ต' },
  { name: 'เชียงใหม่', image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400', province: 'เชียงใหม่' },
]

export default function HomePage() {
  const [tours, setTours] = useState<Tour[]>([])
  const [search, setSearch] = useState('')
  const [province, setProvince] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    tourService.getAll().then(setTours).catch(console.error)
  }, [])

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (province) params.set('province', province)
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

      {/* Hero Section */}
      <section
        className="relative h-[480px] flex items-center justify-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">อยากเที่ยวที่ไหนดี?</h1>
          <p className="text-lg mb-8 text-white/80">ค้นหาทัวร์ที่ใช่สำหรับคุณ</p>

          {/* Search Bar */}
          <div className="bg-white rounded-xl shadow-lg p-3 flex gap-2 max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="ค้นหาทัวร์หรือสถานที่..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-3 py-2 text-gray-800 text-sm outline-none"
            />
            <select
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="px-3 py-2 text-gray-600 text-sm border-l border-gray-200 outline-none bg-white"
            >
              <option value="">ทุกจังหวัด</option>
              <option value="ภูเก็ต">ภูเก็ต</option>
              <option value="กระบี่">กระบี่</option>
              <option value="เชียงใหม่">เชียงใหม่</option>
              <option value="สงขลา">สงขลา</option>
              <option value="สุราษฎร์ธานี">สุราษฎร์ธานี</option>
              <option value="ชุมพร">ชุมพร</option>
              <option value="นครศรีธรรมราช">นครศรีธรรมราช</option>
            </select>
            <button
              onClick={handleSearch}
              className="bg-[#F5A623] hover:bg-[#E09415] text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              ค้นหา
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* แถบหมวดหมู่ */}
        <div className="flex gap-3 mb-10 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className="flex-shrink-0 px-5 py-2 rounded-full border border-gray-200 bg-white text-sm text-gray-600 hover:border-[#F5A623] hover:text-[#F5A623] transition-colors"
            >
              {cat}
            </button>
          ))}
        </div>

        {/* สถานที่คุณอาจชอบ */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-800 mb-4">สถานที่คุณอาจชอบ</h2>
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

        {/* ทัวร์ยอดนิยม */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4">ที่เที่ยวยอดนิยมห้ามพลาด</h2>
          {tours.length === 0 ? (
            <div className="text-center py-12 text-gray-400">กำลังโหลด...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          )}
        </section>
      </div>

      <Footer />

    </div>
  )
}
