import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { favoriteService } from '../services/favoriteService'
import type { FavoriteTour, FavoriteSort } from '../types/favorite'
import { toast } from 'react-hot-toast'

interface UseFavoritesOptions {
  autoFetch?: boolean
}

export function useFavorites(options: UseFavoritesOptions = {}) {
  const { autoFetch = true } = options
  const { user } = useAuth()
  const isCustomer = user?.role === 'customer' && user.profileCompleted

  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set())
  const [favorites, setFavorites] = useState<FavoriteTour[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState<FavoriteSort>('default')

  const toggleLockRef = useRef<Set<number>>(new Set())
  const fetchIdRef = useRef(0)

  const fetchFavorites = useCallback(
    async (sort: FavoriteSort = 'default', offset = 0, limit = 20) => {
      if (!isCustomer) return
      const id = ++fetchIdRef.current
      setLoading(true)
      try {
        const data = await favoriteService.list({ sortBy: sort, offset, limit })
        if (id !== fetchIdRef.current) return
        if (offset === 0) {
          setFavorites(data.items)
        } else {
          setFavorites((prev) => [...prev, ...data.items])
        }
        setTotal(data.total)
        setHasMore(data.hasMore)
        setFavoriteIds((prev) => {
          const next = offset === 0 ? new Set<number>() : new Set(prev)
          data.items.forEach((item) => next.add(item.tourId))
          return next
        })
      } catch {
        // silently fail on list
      } finally {
        if (id === fetchIdRef.current) setLoading(false)
      }
    },
    [isCustomer],
  )

  const fetchAllIds = useCallback(async () => {
    if (!isCustomer) return
    try {
      const data = await favoriteService.list({ limit: 50, offset: 0 })
      const ids = new Set(data.items.map((item) => item.tourId))
      let offset = 50
      let hasMoreIds = data.hasMore
      while (hasMoreIds) {
        const next = await favoriteService.list({ limit: 50, offset })
        next.items.forEach((item) => ids.add(item.tourId))
        hasMoreIds = next.hasMore
        offset += 50
      }
      setFavoriteIds(ids)
    } catch {
      // silently fail
    }
  }, [isCustomer])

  useEffect(() => {
    if (autoFetch && isCustomer) {
      void fetchAllIds()
    }
    if (!isCustomer) {
      setFavoriteIds(new Set())
      setFavorites([])
      setTotal(0)
    }
  }, [autoFetch, isCustomer, fetchAllIds])

  const toggleFavorite = useCallback(
    async (tourId: number) => {
      if (!isCustomer) {
        toast('กรุณาเข้าสู่ระบบเพื่อเพิ่มทัวร์ที่ถูกใจ', { icon: '❤️' })
        return
      }

      if (toggleLockRef.current.has(tourId)) return
      toggleLockRef.current.add(tourId)

      const wasFavorited = favoriteIds.has(tourId)

      // optimistic update
      setFavoriteIds((prev) => {
        const next = new Set(prev)
        if (wasFavorited) {
          next.delete(tourId)
        } else {
          next.add(tourId)
        }
        return next
      })

      if (wasFavorited) {
        setFavorites((prev) => prev.filter((f) => f.tourId !== tourId))
        setTotal((prev) => Math.max(0, prev - 1))
      }

      try {
        if (wasFavorited) {
          await favoriteService.remove(tourId)
        } else {
          await favoriteService.add(tourId)
        }
      } catch {
        // revert optimistic update
        setFavoriteIds((prev) => {
          const next = new Set(prev)
          if (wasFavorited) {
            next.add(tourId)
          } else {
            next.delete(tourId)
          }
          return next
        })

        if (wasFavorited) {
          setTotal((prev) => prev + 1)
        }

        toast.error('ไม่สามารถดำเนินการได้ กรุณาลองใหม่อีกครั้ง')
      } finally {
        toggleLockRef.current.delete(tourId)
      }
    },
    [isCustomer, favoriteIds],
  )

  const isFavorite = useCallback(
    (tourId: number) => favoriteIds.has(tourId),
    [favoriteIds],
  )

  return {
    favorites,
    favoriteIds,
    total,
    hasMore,
    loading,
    sortBy,
    setSortBy,
    isFavorite,
    toggleFavorite,
    fetchFavorites,
    fetchAllIds,
  }
}
