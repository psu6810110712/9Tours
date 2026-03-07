import api from './api'
import type { Tour, CreateTourPayload } from '../types/tour'

export interface TourFilters {
  region?: string
  province?: string
  tourType?: string
  search?: string
  admin?: string
  month?: string
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
  getAll: (filters?: TourFilters) =>
    api.get<Tour[]>('/tours', { params: filters }).then((r) => r.data),

  getRecommendations: (limit = 8) =>
    api.get<Tour[]>('/tours/recommendations', { params: { limit } }).then((r) => r.data),

  getOne: (id: number) =>
    api.get<Tour>(`/tours/${id}`).then((r) => r.data),

  create: (data: CreateTourPayload) =>
    api.post<Tour>('/tours', data).then((r) => r.data),

  update: (id: number, data: Partial<Tour> | CreateTourPayload) =>
    api.patch<Tour>(`/tours/${id}`, data).then((r) => r.data),

  remove: (id: number) =>
    api.delete(`/tours/${id}`).then((r) => r.data),

  // ฟังก์ชันสำหรับอัปโหลดรูปภาพ
  uploadImage: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post<{ url: string }>('/tours/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data.url
  },

  // ฟังก์ชันสำหรับดึงจำนวนที่นั่งว่าง
  getAvailableSeats: async (tourId: number, scheduleId: number): Promise<AvailableSeatsResponse> => {
    const response = await api.get<AvailableSeatsResponse>(
      `/tours/${tourId}/schedule/${scheduleId}/available-seats`
    )
    return response.data
  },
}