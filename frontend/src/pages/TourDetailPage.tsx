import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import TourCard from '../components/TourCard'
import { tourService } from '../services/tourService'
import { useAuth } from '../context/AuthContext'
import type { Tour, TourSchedule } from '../types/tour'

export default function TourDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [tour, setTour] = useState<Tour | null>(null)
  const [related, setRelated] = useState<Tour[]>([])
  const [activeImage, setActiveImage] = useState(0)
  const [selectedSchedule, setSelectedSchedule] = useState<TourSchedule | null>(null)
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!id) return
    tourService.getOne(Number(id)).then((t) => {
      setTour(t)
      if (t.schedules.length > 0) setSelectedSchedule(t.schedules[0])
      // โหลดทัวร์ที่เกี่ยวข้องในจังหวัดเดียวกัน
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

  const totalGuests = adults + children
  const totalPrice = Number(tour.price) * totalGuests
  const seatsLeft = selectedSchedule
    ? selectedSchedule.maxCapacity - selectedSchedule.currentBooked
    : 0

  const handleBooking = () => {
    // ถ้ายังไม่ login ให้กลับไปหน้าแรก (Navbar จะ handle modal)
    if (!user) { navigate('/'); return }
    if (!selectedSchedule) return
    navigate(`/booking/${tour.id}?scheduleId=${selectedSchedule.id}&adults=${adults}&children=${children}`)
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
          {/* ซ้าย: เนื้อหาหลัก */}
          <div className="flex-1 min-w-0">

            {/* Gallery */}
            <div className="mb-6">
              <div className="rounded-xl overflow-hidden h-80 mb-2">
                <img
                  src={tour.images[activeImage] || tour.images[0]}
                  alt={tour.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {tour.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {tour.images.map((img, i) => (
                    <button key={i} onClick={() => setActiveImage(i)}>
                      <img
                        src={img}
                        alt=""
                        className={`w-20 h-14 object-cover rounded-lg flex-shrink-0 transition-opacity ${activeImage === i ? 'opacity-100 ring-2 ring-[#F5A623]' : 'opacity-60 hover:opacity-100'}`}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ชื่อ + คะแนน */}
            <div className="bg-white rounded-xl p-5 mb-4">
              <div className="flex gap-2 mb-2">
                <span className="text-xs bg-[#F5A623]/10 text-[#F5A623] px-2 py-1 rounded-full font-medium">
                  {tour.tourType === 'one_day' ? 'วันเดย์ทริป' : 'แพ็คเกจ'}
                </span>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                  {tour.province}
                </span>
              </div>
              <h1 className="text-xl font-bold text-gray-800 mb-2">{tour.name}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                <span className="text-yellow-400">★★★★★</span>
                <span className="font-semibold text-gray-700">{tour.rating.toFixed(1)}</span>
                <span>({tour.reviewCount} รีวิว)</span>
                <span>·</span>
                <span>⏱ {tour.duration}</span>
                {tour.transportation && <><span>·</span><span>🚗 {tour.transportation}</span></>}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{tour.description}</p>
            </div>

            {/* เกี่ยวกับทัวร์นี้ */}
            {tour.highlights.length > 0 && (
              <div className="bg-white rounded-xl p-5 mb-4">
                <h2 className="font-bold text-gray-800 mb-3">เกี่ยวกับทัวร์นี้</h2>
                <div className="flex flex-wrap gap-2">
                  {tour.highlights.map((h, i) => (
                    <span key={i} className="flex items-center gap-1 bg-green-50 text-green-700 text-sm px-3 py-1 rounded-full">
                      <span>✓</span> {h}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* กำหนดการ */}
            {tour.itinerary.length > 0 && (
              <div className="bg-white rounded-xl p-5 mb-4">
                <h2 className="font-bold text-gray-800 mb-4">กำหนดการ</h2>
                <div className="space-y-4">
                  {tour.itinerary.map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="text-right flex-shrink-0 w-28">
                        <span className="text-xs font-semibold text-[#F5A623] bg-[#F5A623]/10 px-2 py-1 rounded">
                          {item.time}
                        </span>
                      </div>
                      <div className="flex-1 border-l-2 border-gray-100 pl-4 pb-2">
                        <p className="font-medium text-gray-800 text-sm">{item.title}</p>
                        {item.description && (
                          <p className="text-gray-500 text-xs mt-0.5">{item.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* categories */}
            {tour.categories.length > 0 && (
              <div className="bg-white rounded-xl p-5 mb-4">
                <h2 className="font-bold text-gray-800 mb-3">หมวดหมู่</h2>
                <div className="flex flex-wrap gap-2">
                  {tour.categories.map((cat, i) => (
                    <span key={i} className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ขวา: Booking Sidebar */}
          <aside className="w-72 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm p-5 sticky top-20">
              {/* ราคา */}
              <div className="mb-4">
                {tour.originalPrice && (
                  <p className="text-sm text-gray-400 line-through">฿{Number(tour.originalPrice).toLocaleString()}</p>
                )}
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[#F5A623]">฿{Number(tour.price).toLocaleString()}</span>
                  <span className="text-sm text-gray-400">/ คน</span>
                </div>
              </div>

              {/* เลือก schedule */}
              {tour.schedules.length > 0 && (
                <div className="mb-4">
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">เลือกวันที่ / รอบ</label>
                  <select
                    value={selectedSchedule?.id || ''}
                    onChange={(e) => {
                      const s = tour.schedules.find((x) => x.id === Number(e.target.value))
                      setSelectedSchedule(s || null)
                    }}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none"
                  >
                    {tour.schedules.map((s) => (
                      <option key={s.id} value={s.id} disabled={s.maxCapacity - s.currentBooked === 0}>
                        {s.startDate}{s.startDate !== s.endDate ? ` - ${s.endDate}` : ''}
                        {s.roundName ? ` (${s.roundName})` : ''}
                        {s.maxCapacity - s.currentBooked === 0 ? ' - เต็มแล้ว' : ''}
                      </option>
                    ))}
                  </select>
                  {selectedSchedule && (
                    <p className="text-xs text-gray-400 mt-1">
                      เหลือ {seatsLeft}/{selectedSchedule.maxCapacity} ที่นั่ง
                    </p>
                  )}
                </div>
              )}

              {/* จำนวนคน */}
              <div className="mb-4 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">ผู้ใหญ่</label>
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button onClick={() => setAdults(Math.max(1, adults - 1))} className="px-3 py-1.5 text-gray-500 hover:bg-gray-50">-</button>
                    <span className="flex-1 text-center text-sm font-medium">{adults}</span>
                    <button onClick={() => setAdults(Math.min(seatsLeft, adults + 1))} className="px-3 py-1.5 text-gray-500 hover:bg-gray-50">+</button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">เด็ก</label>
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button onClick={() => setChildren(Math.max(0, children - 1))} className="px-3 py-1.5 text-gray-500 hover:bg-gray-50">-</button>
                    <span className="flex-1 text-center text-sm font-medium">{children}</span>
                    <button onClick={() => setChildren(children + 1)} className="px-3 py-1.5 text-gray-500 hover:bg-gray-50">+</button>
                  </div>
                </div>
              </div>

              {/* ราคารวม */}
              <div className="border-t border-gray-100 pt-3 mb-4">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>฿{Number(tour.price).toLocaleString()} × {totalGuests} คน</span>
                </div>
                <div className="flex justify-between font-bold text-gray-800">
                  <span>รวมทั้งหมด</span>
                  <span className="text-[#F5A623]">฿{totalPrice.toLocaleString()}</span>
                </div>
              </div>

              {/* ปุ่มจอง */}
              <button
                onClick={handleBooking}
                disabled={!selectedSchedule || seatsLeft === 0}
                className="w-full bg-[#F5A623] hover:bg-[#E09415] disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {seatsLeft === 0 ? 'เต็มแล้ว' : 'จองเลย'}
              </button>
              <p className="text-xs text-center text-gray-400 mt-2">ยกเลิกได้ภายใน 24 ชั่วโมง</p>
            </div>
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
