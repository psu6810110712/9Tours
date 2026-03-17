import api from './api'
import type { Booking } from '../types/booking'

export interface TourScheduleOverview {
    id: number
    startDate: string
    endDate: string
    roundName: string
    timeSlot: string
    maxCapacity: number
    currentBooked: number
    availableSeats: number
    occupancyPercent: number
}

export interface TourOverview {
    id: number
    tourCode: string
    name: string
    tourType: string
    province: string
    region: string
    images: string[]
    isActive: boolean
    totalSchedules: number
    schedules: TourScheduleOverview[]
}

export const adminService = {
    getAllBookings: async () => {
        const response = await api.get<Booking[]>('/bookings/admin/all')
        return response.data
    },

    updateBookingStatus: async (bookingId: number, status: string, refundAction?: 'approve' | 'reject') => {
        const response = await api.patch<Booking>(`/bookings/${bookingId}/status`, { status, refundAction })
        return response.data
    },

    getTourOverview: async (): Promise<TourOverview[]> => {
        const response = await api.get<TourOverview[]>('/tours/admin/overview')
        return response.data
    },

    getBookingsBySchedule: async (scheduleId: number): Promise<Booking[]> => {
        const response = await api.get<Booking[]>(`/bookings/admin/schedule/${scheduleId}`)
        return response.data
    },
}
