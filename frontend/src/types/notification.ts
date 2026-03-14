export interface Notification {
  id: number
  userId: string
  bookingId: number | null
  type: 'booking_confirmed' | 'booking_success' | 'booking_canceled'
  title: string
  message: string
  isRead: boolean
  createdAt: string
}
