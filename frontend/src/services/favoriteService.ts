import api from './api'
import type { FavoritesListResponse, FavoriteTour, ListFavoritesParams } from '../types/favorite'

export const favoriteService = {
  list: (params?: ListFavoritesParams) => {
    const query: Record<string, string | number> = {}
    if (params?.sortBy) query.sortBy = params.sortBy
    if (typeof params?.limit === 'number') query.limit = params.limit
    if (typeof params?.offset === 'number') query.offset = params.offset
    return api.get<FavoritesListResponse>('/favorites', { params: query }).then((r) => r.data)
  },

  add: (tourId: number) =>
    api.post<FavoriteTour>(`/favorites/${tourId}`).then((r) => r.data),

  remove: (tourId: number) =>
    api.delete<{ removed: boolean }>(`/favorites/${tourId}`).then((r) => r.data),
}
