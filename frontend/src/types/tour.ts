export type TourType = 'one_day' | 'package'

export interface Festival {
  id: number
  name: string
  startDate: string
  endDate: string
}

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
  festivalId?: number | null
  festival?: Festival | null
  schedules: TourSchedule[]
  createdAt: string
  updatedAt: string
}

export interface CreateSchedulePayload {
  id?: number
  startDate: string
  endDate: string
  timeSlot: string | null
  roundName: string | null
  maxCapacity: number
  currentBooked?: number
}

export interface CreateTourPayload {
  name: string
  description: string
  tourType: TourType
  categories: string[]
  price: number
  childPrice?: number | null
  originalPrice?: number | null
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
  isActive?: boolean
  festivalId?: number | null
}

export interface UpdateTourPayload extends Partial<CreateTourPayload> {
  isActive?: boolean
}
