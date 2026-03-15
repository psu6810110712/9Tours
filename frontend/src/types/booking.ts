import type { User } from './user'
import type { CustomerPrefix } from '../utils/profileValidation'

export interface Payment {
  id: number
  amountPaid: number
  slipUrl: string
  paymentMethod: string
  uploadedAt: string
  verificationStatus?: 'pending' | 'verified' | 'duplicate' | 'amount_mismatch' | 'unreadable' | 'failed' | 'unavailable'
  verifiedAmount?: number | null
  verifiedTransRef?: string | null
  verifiedAt?: string | null
  verificationProvider?: string | null
  verificationMessage?: string | null
  verificationRaw?: Record<string, unknown> | null
}

export interface Tour {
  id: number
  name: string
  description?: string
  price: number
  tourCode?: string
  childPrice?: number
  minPeople?: number
  maxPeople?: number
  images: string[]
  accommodation?: string
  duration?: string | null
  transportation?: string | null
  highlights?: string[]
  itinerary?: { day?: number; time: string; title: string; description: string }[]
}

export interface Schedule {
  id: number
  startDate: string
  endDate: string
  timeSlot?: string | null
  roundName?: string | null
  tour: Tour
}

export interface Booking {
  id: number
  userId: string
  scheduleId: number
  paxCount: number
  adults: number
  children: number
  totalPrice: number
  status: string
  createdAt: string
  payments: Payment[]
  schedule: Schedule | null
  user?: User
  specialRequest?: string
  contactPrefix?: CustomerPrefix | null
  contactName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
}

export interface CreateBookingDto {
  scheduleId: number
  paxCount: number
  adults?: number
  children?: number
  specialRequest?: string
  contactPrefix: CustomerPrefix
  contactName: string
  contactEmail: string
  contactPhone: string
}
