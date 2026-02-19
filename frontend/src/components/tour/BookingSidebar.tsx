import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import type { Tour, TourSchedule } from '../../types/tour'

interface BookingSidebarProps {
  tour: Tour
}

export default function BookingSidebar({ tour }: BookingSidebarProps) {
  const [selectedSchedule, setSelectedSchedule] = useState<TourSchedule | null>(
    tour.schedules[0] ?? null
  )
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const { user } = useAuth()
  const navigate = useNavigate()

  const hasSchedule = tour.schedules.length > 0
  const seatsLeft = selectedSchedule
    ? selectedSchedule.maxCapacity - selectedSchedule.currentBooked
    : 0
  const totalGuests = adults + children
  const totalPrice = Number(tour.price) * totalGuests

  const handleBooking = () => {
    if (!user) { navigate('/'); return }
    if (!selectedSchedule) return
    navigate(`/booking/${tour.id}?scheduleId=${selectedSchedule.id}&adults=${adults}&children=${children}`)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sticky top-20">
      {/* ราคา */}
      <div className="mb-3">
        {tour.originalPrice && (
          <p className="text-xs text-gray-400 line-through">
            ฿{Number(tour.originalPrice).toLocaleString()}
          </p>
        )}
        <div className="flex items-baseline gap-1.5">
          <span className="text-[30px] leading-none font-bold text-[#111827]">
            ฿{Number(tour.price).toLocaleString()}
          </span>
          <span className="text-sm text-gray-500">บาท</span>
        </div>
      </div>

      {/* เลือก schedule */}
      {tour.schedules.length > 0 && (
        <div className="mb-3">
          <label className="text-xs font-semibold text-gray-500 mb-1 block">เลือกวันที่</label>
          <select
            value={selectedSchedule?.id || ''}
            onChange={(e) => {
              const s = tour.schedules.find((x) => x.id === Number(e.target.value))
              setSelectedSchedule(s ?? null)
            }}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none bg-white"
          >
            {tour.schedules.map((s) => {
              const left = s.maxCapacity - s.currentBooked
              return (
                <option key={s.id} value={s.id} disabled={left === 0}>
                  {s.startDate}{s.startDate !== s.endDate ? ` - ${s.endDate}` : ''}
                  {s.roundName ? ` (${s.roundName})` : ''}
                  {left === 0 ? ' - เต็มแล้ว' : ''}
                </option>
              )
            })}
          </select>
          {selectedSchedule && <p className="text-xs text-gray-400 mt-1">เหลือ {seatsLeft}/{selectedSchedule.maxCapacity} ที่นั่ง</p>}
        </div>
      )}

      {/* จำนวนคน */}
      <div className="mb-3">
        <label className="text-xs font-semibold text-gray-500 mb-1 block">จำนวนผู้เดินทาง</label>
        <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'ผู้ใหญ่', value: adults, min: 1, set: setAdults },
          { label: 'เด็ก', value: children, min: 0, set: setChildren },
        ].map(({ label, value, min, set }) => (
          <div key={label}>
            <label className="text-xs text-gray-500 mb-1 block">{label}</label>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button onClick={() => set(Math.max(min, value - 1))} className="px-3 py-1.5 text-gray-500 hover:bg-gray-50">-</button>
              <span className="flex-1 text-center text-sm font-medium">{value}</span>
              <button onClick={() => set(value + 1)} className="px-3 py-1.5 text-gray-500 hover:bg-gray-50">+</button>
            </div>
          </div>
        ))}
        </div>
      </div>

      {/* ราคารวม */}
      <div className="border-t border-gray-100 pt-3 mb-3">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>฿{Number(tour.price).toLocaleString()} × {totalGuests} คน</span>
        </div>
        <div className="flex justify-between font-bold text-gray-800">
          <span>รวมทั้งหมด</span>
          <span className="text-[#F5A623]">฿{totalPrice.toLocaleString()}</span>
        </div>
      </div>

      <button
        onClick={handleBooking}
        disabled={!selectedSchedule || seatsLeft === 0}
        className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-2.5 rounded-xl transition-colors"
      >
        {!hasSchedule ? 'ยังไม่มีรอบให้จอง' : seatsLeft === 0 ? 'เต็มแล้ว' : 'จองเลย'}
      </button>
      <p className="text-xs text-center text-gray-400 mt-2">ยกเลิกได้ภายใน 24 ชั่วโมง</p>
    </div>
  )
}
