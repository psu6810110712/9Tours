import { useEffect, useState } from 'react'
import { bookingService } from '../services/bookingService'
import type { Booking } from '../types/booking'

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [slipPreviewUrls, setSlipPreviewUrls] = useState<Record<number, string>>({})

  useEffect(() => {
    void fetchBookings()
  }, [])

  useEffect(() => {
    let cancelled = false
    const createdUrls: string[] = []

    const loadSlipPreviews = async () => {
      const payments = bookings.flatMap((booking) => booking.payments ?? [])
      if (payments.length === 0) {
        setSlipPreviewUrls({})
        return
      }

      const entries = await Promise.all(payments.map(async (payment) => {
        try {
          const blob = await bookingService.getProtectedSlipBlob(payment.id)
          const objectUrl = URL.createObjectURL(blob)
          createdUrls.push(objectUrl)
          return [payment.id, objectUrl] as const
        } catch {
          return [payment.id, ''] as const
        }
      }))

      if (!cancelled) {
        setSlipPreviewUrls(Object.fromEntries(entries.filter(([, url]) => url)))
      }
    }

    void loadSlipPreviews()

    return () => {
      cancelled = true
      createdUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [bookings])

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

  if (loading) return <div className="p-8 text-center">กําลังโหลดข้อมูล...</div>

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <h1 className="mb-6 text-2xl font-bold">รายการจองของฉัน</h1>

      <div className="space-y-6">
        {bookings.map((booking) => (
          <div key={booking.id} className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {booking.schedule?.tour?.name || 'ไม่พบข้อมูลทัวร์ (อาจถูกลบ)'}
                </h2>
                <p className="mt-1 text-gray-600">
                  วันที่เดินทาง: {booking.schedule?.startDate || '-'}
                </p>
                <p className="text-gray-600">
                  จำนวน: {booking.paxCount} ท่าน | ราคารวม: {booking.totalPrice.toLocaleString()} บาท
                </p>
              </div>
              <div>
                <span className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusClass(booking.status)}`}>
                  {booking.status}
                </span>
              </div>
            </div>

            {booking.payments && booking.payments.length > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <h3 className="mb-3 text-sm font-medium text-gray-700">หลักฐานการชำระเงิน</h3>
                <div className="flex flex-wrap gap-4">
                  {booking.payments.map((payment) => (
                    <div key={payment.id} className="group relative">
                      {slipPreviewUrls[payment.id] ? (
                        <img
                          src={slipPreviewUrls[payment.id]}
                          alt="Payment Slip"
                          className="h-32 w-auto cursor-pointer rounded border border-gray-200 object-cover transition-opacity hover:opacity-90"
                          onClick={() => window.open(slipPreviewUrls[payment.id], '_blank', 'noopener,noreferrer')}
                          title="คลิกเพื่อดูภาพใหญ่"
                        />
                      ) : (
                        <div className="flex h-32 w-24 items-center justify-center rounded border border-dashed border-gray-200 text-xs text-gray-400">
                          โหลดสลิปไม่ได้
                        </div>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
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
          <div className="rounded-lg border border-dashed bg-gray-50 py-12 text-center text-gray-500">
            ยังไม่มีรายการจอง
          </div>
        )}
      </div>
    </div>
  )
}

function getStatusClass(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return 'bg-green-100 text-green-800'
    case 'PENDING_PAYMENT':
      return 'bg-yellow-100 text-yellow-800'
    case 'CANCELED':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
