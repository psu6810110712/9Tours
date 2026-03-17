export interface ReviewUser {
  id: string
  name: string
}

export interface Review {
  id: number
  bookingId: number
  userId: string
  tourId: number
  rating: number
  comment: string
  createdAt: string
  user?: ReviewUser
}

export interface ReviewsResponse {
  data: Review[]
  total: number
}
