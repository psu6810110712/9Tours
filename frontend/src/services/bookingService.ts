import api from './api'
import type { Booking, CreateBookingDto } from '../types/booking'

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

  cancelBooking: async (id: string): Promise<Booking> => {
    const response = await api.patch(`/bookings/${id}/cancel`)
    return response.data
  },
}
