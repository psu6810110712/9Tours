import type { Tour } from './tour'

export type FavoriteSort = 'default' | 'price_asc' | 'price_desc' | 'rating'

export interface FavoriteTour {
  id: number
  userId: string
  tourId: number
  tour: Tour
  createdAt: string
}

export interface FavoritesListResponse {
  items: FavoriteTour[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export interface ListFavoritesParams {
  sortBy?: FavoriteSort
  limit?: number
  offset?: number
}
