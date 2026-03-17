import api from './api'
import type { Booking, CreateBookingDto, PaymentQr } from '../types/booking'

export const bookingService = {
  createBooking: async (data: CreateBookingDto): Promise<Booking> => {
    const response = await api.post('/bookings', data)
    return response.data
  },

  getMyBookings: async (): Promise<Booking[]> => {
    const response = await api.get('/bookings/my')
    return response.data
  },

  getBookingById: async (id: string): Promise<Booking> => {
    const response = await api.get(`/bookings/${id}`)
    return response.data
  },

  getPaymentQr: async (bookingId: number): Promise<PaymentQr> => {
    const response = await api.get(`/payments/bookings/${bookingId}/qr`)
    return response.data
  },

  cancelBooking: async (id: string, reason?: string): Promise<Booking> => {
    const response = await api.patch(`/bookings/${id}/cancel`, { reason })
    return response.data
  },

  // ฟังก์ชันสำหรับอัปโหลดสลิปการชำระเงิน
  uploadPaymentSlip: async (bookingId: number, amount: number, slipFile: File, paymentMethod: string = 'BANK_TRANSFER'): Promise<any> => {
    const formData = new FormData()
    formData.append('bookingId', bookingId.toString())
    formData.append('amount', amount.toString())
    formData.append('slip', slipFile)
    formData.append('paymentMethod', paymentMethod)

    const response = await api.post('/payments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  getProtectedSlipBlob: async (paymentId: number): Promise<Blob> => {
    const response = await api.get(`/payments/${paymentId}/slip`, {
      responseType: 'blob',
    })
    return response.data
  },
}
