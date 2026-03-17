import api from './api'
import type { Festival } from '../types/tour'

export interface CreateFestivalPayload {
  name: string
  startDate: string
  endDate: string
}

export interface UpdateFestivalPayload {
  name?: string
  startDate?: string
  endDate?: string
}

export const festivalService = {
  getAll: () => api.get<Festival[]>('/festivals').then((r) => r.data),
  create: (data: CreateFestivalPayload) => api.post<Festival>('/festivals', data).then((r) => r.data),
  update: (id: number, data: UpdateFestivalPayload) => api.patch<Festival>(`/festivals/${id}`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/festivals/${id}`).then((r) => r.data),
}
