import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
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
      <div className="flex items-center justify-center h-96 text-gray-400">กำลังโหลด...</div>
    )
  }

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="text-sm font-medium text-gray-400 mb-5 flex gap-2">
          <Link to="/" className="hover:text-accent">หน้าแรก</Link>
          <span>/</span>
          <Link to={`/tours?province=${tour.province}`} className="hover:text-accent">{tour.province}</Link>
          <span>/</span>
          <span className="text-gray-600 line-clamp-1">{tour.name}</span>
        </nav>

        {/* แถวบน: รูป + thumbnail เต็มความกว้างคอนเทนต์ */}
        <div className="mb-6">
          <TourGallery images={tour.images} name={tour.name} />
        </div>

        {/* แถวล่าง: ซ้ายข้อมูล / ขวาจอง */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 min-w-0">
            <TourInfo tour={tour} />
            <TourItinerary items={tour.itinerary} />
          </div>

          <aside className="lg:col-span-4 lg:pl-3 lg:border-l lg:border-gray-200/80">
            <BookingSidebar tour={tour} />
          </aside>
        </div>

        {/* ทัวร์แนะนำ */}
        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-bold text-gray-900 mb-5">ทัวร์แนะนำใน{tour.province}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((t) => <TourCard key={t.id} tour={t} />)}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
