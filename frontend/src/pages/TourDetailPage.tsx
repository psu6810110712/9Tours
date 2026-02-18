import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import TourCard from '../components/TourCard'
import TourGallery from '../components/tour/TourGallery'
import TourInfo from '../components/tour/TourInfo'
import TourItinerary from '../components/tour/TourItinerary'
import BookingSidebar from '../components/tour/BookingSidebar'
import { tourService } from '../services/tourService'
import type { Tour } from '../types/tour'

export default function TourDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [tour, setTour] = useState<Tour | null>(null)
  const [related, setRelated] = useState<Tour[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    if (!id) return
    tourService.getOne(Number(id)).then((t) => {
      setTour(t)
      tourService.getAll({ province: t.province }).then((list) => {
        setRelated(list.filter((x) => x.id !== t.id).slice(0, 4))
      })
    }).catch(() => navigate('/tours'))
  }, [id])

  if (!tour) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96 text-gray-400">กำลังโหลด...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-400 mb-4 flex gap-2">
          <Link to="/" className="hover:text-[#F5A623]">หน้าแรก</Link>
          <span>/</span>
          <Link to={`/tours?province=${tour.province}`} className="hover:text-[#F5A623]">{tour.province}</Link>
          <span>/</span>
          <span className="text-gray-600 line-clamp-1">{tour.name}</span>
        </nav>

        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            <TourGallery images={tour.images} name={tour.name} />
            <TourInfo tour={tour} />
            <TourItinerary items={tour.itinerary} />
          </div>

          <aside className="w-72 flex-shrink-0">
            <BookingSidebar tour={tour} />
          </aside>
        </div>

        {/* ทัวร์แนะนำ */}
        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4">ทัวร์แนะนำใน{tour.province}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((t) => <TourCard key={t.id} tour={t} />)}
            </div>
          </section>
        )}
      </div>

      <Footer />
    </div>
  )
}
