import api from './api'
import type { Tour } from '../types/tour'

export interface TourFilters {
  region?: string
  province?: string
  tourType?: string
  search?: string
  admin?: string
}

export const tourService = {
  getAll: (filters?: TourFilters) =>
    api.get<Tour[]>('/tours', { params: filters }).then((r) => r.data),

  getOne: (id: number) =>
    api.get<Tour>(`/tours/${id}`).then((r) => r.data),

  create: (data: Partial<Tour>) =>
    api.post<Tour>('/tours', data).then((r) => r.data),

  update: (id: number, data: Partial<Tour>) =>
    api.patch<Tour>(`/tours/${id}`, data).then((r) => r.data),

  remove: (id: number) =>
    api.delete(`/tours/${id}`).then((r) => r.data),
}
