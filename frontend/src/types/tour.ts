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
  childPrice?: number | null
  originalPrice: number | null
  images: string[]
  highlights: string[]
  itinerary: { day?: number; time: string; title: string; description: string }[]
  transportation: string
  duration: string
  region: string
  province: string
  accommodation: string | null
  minPeople?: number
  maxPeople?: number
  rating: number
  reviewCount: number
  isActive: boolean
  schedules: TourSchedule[]
  createdAt: string
  updatedAt: string
}

// === Payload types for creating/updating tours ===
export interface CreateSchedulePayload {
  startDate: string
  endDate: string
  timeSlot: string | null
  roundName: string | null
  maxCapacity: number
}

export interface CreateTourPayload {
  name: string
  description: string
  tourType: TourType
  categories: string[]
  price: number
  childPrice?: number | null
  minPeople?: number
  maxPeople?: number
  highlights: string[]
  images: string[]
  transportation: string
  duration: string
  region: string
  province: string
  accommodation: string | null
  itinerary: { day?: number; time: string; title: string; description: string }[]
  schedules: CreateSchedulePayload[]
}

