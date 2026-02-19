import api from './api'
import type { Booking, CreateBookingDto } from '../types/booking'

export const bookingService = {
  create: (data: CreateBookingDto) =>
    api.post<Booking>('/bookings', data).then((r) => r.data),

  getMy: () =>
    api.get<Booking[]>('/bookings/my').then((r) => r.data),

  cancel: (bookingCode: string) =>
    api.patch(`/bookings/${bookingCode}/cancel`).then((r) => r.data),

  // admin
  getAll: () =>
    api.get<Booking[]>('/bookings').then((r) => r.data),

  updateStatus: (bookingCode: string, status: string) =>
    api.patch(`/bookings/${bookingCode}/status`, { status }).then((r) => r.data),
}
