import api from './api'
import type { Festival } from '../types/tour'

export const festivalService = {
  getAll: () => api.get<Festival[]>('/festivals').then((r) => r.data),
}
