export type TourType = 'one_day' | 'package'

export interface TourSchedule {
  id: number
  tourId: number
  startDate: string
  endDate: string
  timeSlot: string | null
  roundName: string | null
  maxCapacity: number
  currentBooked: number
}

export interface Tour {
  id: number
  tourCode: string
  name: string
  description: string
  tourType: TourType
  categories: string[]
  price: number
  originalPrice: number | null
  images: string[]
  highlights: string[]
  itinerary: { time: string; title: string; description: string }[]
  transportation: string
  duration: string
  region: string
  province: string
  accommodation: string | null
  rating: number
  reviewCount: number
  isActive: boolean
  schedules: TourSchedule[]
  createdAt: string
  updatedAt: string
}
