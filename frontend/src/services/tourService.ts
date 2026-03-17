import api from './api'
import type { Tour, CreateTourPayload, UpdateTourPayload } from '../types/tour'

export interface TourFilters {
  region?: string
  province?: string
  tourType?: string
  search?: string
  admin?: string
  month?: string
  categories?: string[]
  minPrice?: number
  maxPrice?: number
  festivalId?: number
}

export interface AvailableSeatsResponse {
  tourId: number
  scheduleId: number
  maxCapacity: number
  currentBooked: number
  availableSeats: number
  isFull: boolean
}

export const tourService = {
  getAll: (filters?: TourFilters) => {
    const params: Record<string, number | string> = {}

    if (filters?.region) params.region = filters.region
    if (filters?.province) params.province = filters.province
    if (filters?.tourType) params.tourType = filters.tourType
    if (filters?.search) params.search = filters.search
    if (filters?.admin) params.admin = filters.admin
    if (filters?.month) params.month = filters.month
    if (filters?.categories?.length) params.categories = filters.categories.join(',')
    if (typeof filters?.minPrice === 'number') params.minPrice = filters.minPrice
    if (typeof filters?.maxPrice === 'number') params.maxPrice = filters.maxPrice
    if (filters?.festivalId) params.festivalId = filters.festivalId

    return api.get<Tour[]>('/tours', { params }).then((r) => r.data)
  },

  getRecommendations: (limit = 8) =>
    api.get<Tour[]>('/tours/recommendations', { params: { limit } }).then((r) => r.data),

  getOne: (id: number) =>
    api.get<Tour>(`/tours/${id}`).then((r) => r.data),

  create: (data: CreateTourPayload) =>
    api.post<Tour>('/tours', data).then((r) => r.data),

  update: (id: number, data: UpdateTourPayload | Partial<Tour>) =>
    api.patch<Tour>(`/tours/${id}`, data).then((r) => r.data),

  remove: (id: number) =>
    api.delete(`/tours/${id}`).then((r) => r.data),

  uploadImage: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post<{ url: string }>('/tours/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.url
  },

  getAvailableSeats: async (tourId: number, scheduleId: number): Promise<AvailableSeatsResponse> => {
    const response = await api.get<AvailableSeatsResponse>(
      `/tours/${tourId}/schedule/${scheduleId}/available-seats`
    )
    return response.data
  },
}
