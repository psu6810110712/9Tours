import api from './api'
import type { Notification } from '../types/notification'

export const notificationService = {
  getNotifications: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications')
    return response.data
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get('/notifications/unread-count')
    return response.data.count
  },

  markAsRead: async (id: number): Promise<void> => {
    await api.patch(`/notifications/${id}/read`)
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all')
  },
}
