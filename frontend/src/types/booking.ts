import type { Tour, TourSchedule } from './tour'
import type { User } from './user'

// === Booking Status ===
export type BookingStatus =
    | 'pending_payment'
    | 'awaiting_approval'
    | 'success'
    | 'canceled'
    | 'refund_pending'
    | 'refund_completed'

// === Payment ===
export interface Payment {
    id: number
    bookingId: number
    amountPaid: number
    slipUrl: string | null
    paymentMethod: string | null
    uploadedAt: string
}

// === Schedule with nested Tour (as returned by booking endpoints) ===
export interface BookingSchedule extends TourSchedule {
    tour?: Tour
}

// === Booking ===
export interface Booking {
    id: number
    userId: number
    scheduleId: number
    paxCount: number
    totalPrice: number
    status: BookingStatus
    adminNotes: string | null
    createdAt: string
    schedule?: BookingSchedule
    user?: User
    payments?: Payment[]
}

// === DTOs ===
export interface CreateBookingDto {
    scheduleId: number
    paxCount: number
}
