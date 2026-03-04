import type { User } from './user'

export interface Payment {
  id: number
  amountPaid: number
  slipUrl: string
  paymentMethod: string
  uploadedAt: string
}

export interface Tour {
  id: number
  name: string
  price: number
  tourCode?: string
  childPrice?: number
  images: string[]
  accommodation?: string
}

export interface Schedule {
  id: number
  startDate: string
  endDate: string
  tour: Tour
}

export interface Booking {
  id: number
  userId: number
  scheduleId: number
  paxCount: number
  adults: number
  children: number
  totalPrice: number
  status: string // 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELED'
  createdAt: string
  payments: Payment[]
  schedule: Schedule | null
  user?: User
}

export interface CreateBookingDto {
  scheduleId: number
  paxCount: number
  adults?: number
  children?: number
}