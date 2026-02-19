export type BookingStatus = 'pending' | 'paid' | 'cancelled' | 'completed'

export interface Booking {
  bookingCode: string
  tourId: number
  scheduleId: number
  userId: number
  contactName: string
  contactEmail: string
  contactPhone: string
  adults: number
  children: number
  specialRequests: string | null
  totalPrice: number
  status: BookingStatus
  paymentProof: string | null
  createdAt: string
  tour?: {
    name: string
    images: string[]
    province: string
    duration: string
  }
  schedule?: {
    startDate: string
    endDate: string
    roundName: string | null
  }
}

export interface CreateBookingDto {
  tourId: number
  scheduleId: number
  contactName: string
  contactEmail: string
  contactPhone: string
  adults: number
  children: number
  specialRequests?: string
}
