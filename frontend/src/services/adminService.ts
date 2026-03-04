import api from './api'
import type { Booking } from '../types/booking'

export const adminService = {
    getAllBookings: async () => {
        const response = await api.get<Booking[]>('/bookings/admin/all')
        return response.data
    },

    updateBookingStatus: async (bookingId: number, status: string) => {
        const response = await api.patch<Booking>(`/bookings/${bookingId}/status`, { status })
        return response.data
    },
}
