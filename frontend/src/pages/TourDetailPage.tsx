import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import TourCard from '../components/TourCard'
import TourGallery from '../components/tour/TourGallery'
import TourInfo from '../components/tour/TourInfo'
import TourItinerary from '../components/tour/TourItinerary'
import BookingSidebar from '../components/tour/BookingSidebar'
import ReviewList from '../components/reviews/ReviewList'
import { trackEvent } from '../services/trackingService'
import { tourService } from '../services/tourService'
import { useAuth } from '../context/AuthContext'
import { useFavoritesContext } from '../context/FavoritesContext'
import type { Tour } from '../types/tour'

export default function TourDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [tour, setTour] = useState<Tour | null>(null)
  const [related, setRelated] = useState<Tour[]>([])
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const { isFavorite, toggleFavorite } = useFavoritesContext()
  const trackedTourIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!id) return

    tourService.getOne(Number(id))
      .then((item) => {
        setTour(item)
        return tourService.getAll({ province: item.province }).then((list) => {
          setRelated(list.filter((candidate) => candidate.id !== item.id).slice(0, 4))
        })
      })
      .catch(() => navigate('/tours'))
  }, [id, navigate])

  useEffect(() => {
    if (!tour?.id) return
    if (trackedTourIdRef.current === tour.id) return

    trackedTourIdRef.current = tour.id
    void trackEvent({
      eventType: 'page_view',
      pagePath: `/tours/${tour.id}`,
      tourId: tour.id,
      metadata: { source: 'tour_detail_page' },
    })
  }, [tour?.id])

  if (!tour) {
    return (
      <div className="flex h-96 items-center justify-center text-gray-400">กำลังโหลด...</div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <nav className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-400">
          <Link to="/" className="transition-colors hover:text-accent">หน้าแรก</Link>
          <span>/</span>
          <Link to={`/tours?province=${tour.province}`} className="transition-colors hover:text-accent">{tour.province}</Link>
          <span>/</span>
          <span className="line-clamp-1 text-gray-600">{tour.name}</span>
        </nav>
        {isAdmin && (
          <Link
            to={`/admin/tours/${tour.id}/edit`}
            className="ui-pressable inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700 hover:bg-amber-100"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232 18.768 8.768M16.732 3.732a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            แก้ไขทัวร์
          </Link>
        )}
      </div>

      <div className="mb-6">
        <TourGallery images={tour.images} name={tour.name} />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8">
          <TourInfo tour={tour} />
          <TourItinerary items={tour.itinerary} />
          <ReviewList tourId={tour.id} />
        </div>

        <aside className="lg:col-span-4">
          <BookingSidebar tour={tour} />
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">ทริปอื่นใน{tour.province}</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {related.map((item) => (
              <TourCard
                key={item.id}
                tour={item}
                isFavorite={isFavorite(item.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
