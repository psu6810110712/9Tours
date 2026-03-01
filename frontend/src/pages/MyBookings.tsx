import React, { useEffect, useState } from 'react'
import { bookingService } from '../services/bookingService'
import type { Booking } from '../types/booking'

// ดึง URL ของ Backend จาก Environment Variable หรือใช้ค่า Default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      const data = await bookingService.getMyBookings()
      setBookings(data)
    } catch (error) {
      console.error('Failed to fetch bookings', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center">กำลังโหลดข้อมูล...</div>

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">รายการจองของฉัน</h1>

      <div className="space-y-6">
        {bookings.map((booking) => (
          <div key={booking.id} className="border rounded-lg p-6 shadow-sm bg-white">
            {/* ส่วนหัว: ข้อมูลทัวร์และสถานะ */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {booking.schedule?.tour?.name || 'ไม่พบข้อมูลทัวร์ (อาจถูกลบ)'}
                </h2>
                <p className="text-gray-600 mt-1">
                  📅 วันที่เดินทาง: {booking.schedule?.startDate || '-'}
                </p>
                <p className="text-gray-600">
                  👥 จำนวน: {booking.paxCount} ท่าน | 💰 ราคารวม: {booking.totalPrice.toLocaleString()} บาท
                </p>
              </div>
              <div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(booking.status)}`}>
                  {booking.status}
                </span>
              </div>
            </div>

            {/* ส่วนแสดงสลิปการโอนเงิน (ถ้ามี) */}
            {booking.payments && booking.payments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-3">หลักฐานการชำระเงิน</h3>
                <div className="flex flex-wrap gap-4">
                  {booking.payments.map((payment) => (
                    <div key={payment.id} className="group relative">
                      <img
                        src={`${API_URL}/${payment.slipUrl}`}
                        alt="Payment Slip"
                        className="h-32 w-auto object-cover rounded border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(`${API_URL}/${payment.slipUrl}`, '_blank')}
                        title="คลิกเพื่อดูภาพใหญ่"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        อัปโหลดเมื่อ: {new Date(payment.uploadedAt).toLocaleDateString('th-TH')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {bookings.length === 0 && (
          <div className="text-center text-gray-500 py-12 bg-gray-50 rounded-lg border border-dashed">
            ยังไม่มีรายการจอง
          </div>
        )}
      </div>
    </div>
  )
}

function getStatusClass(status: string) {
  switch (status) {
    case 'CONFIRMED': return 'bg-green-100 text-green-800'
    case 'PENDING_PAYMENT': return 'bg-yellow-100 text-yellow-800'
    case 'CANCELED': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}