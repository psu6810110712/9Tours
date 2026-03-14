export interface Notification {
  id: number
  userId: string
  bookingId: number | null
  type: 'booking_confirmed' | 'booking_success' | 'booking_canceled' | 'new_booking' | 'payment_uploaded'
  title: string
  message: string
  isRead: boolean
  createdAt: string
}
