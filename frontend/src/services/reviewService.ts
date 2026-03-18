import api from './api'
import type { ReviewsResponse } from '../types/review'

export const reviewService = {
  submitReview: async (bookingId: number, rating: number, comment: string): Promise<void> => {
    await api.post('/reviews', { bookingId, rating, comment })
  },

  getReviews: async (tourId: number, limit: number = 10, offset: number = 0): Promise<ReviewsResponse> => {
    const response = await api.get('/reviews', { params: { tourId, limit, offset } })
    return response.data
  },
}
