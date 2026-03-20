import { useCallback, useEffect, useRef, useState } from 'react'
import TourCard from '../components/TourCard'
import { useFavoritesContext } from '../context/FavoritesContext'
import { favoriteService } from '../services/favoriteService'
import type { FavoriteTour, FavoriteSort } from '../types/favorite'

const SORT_OPTIONS = [
  { value: 'default', label: 'เรียงตาม: ล่าสุด' },
  { value: 'price_asc', label: 'ราคา: ต่ำ → สูง' },
  { value: 'price_desc', label: 'ราคา: สูง → ต่ำ' },
  { value: 'rating', label: 'คะแนนสูงสุด' },
] as const

const PAGE_SIZE = 20

export default function FavoritesPage() {
  const { isFavorite, toggleFavorite } = useFavoritesContext()

  const [items, setItems] = useState<FavoriteTour[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [sortBy, setSortBy] = useState<FavoriteSort>('default')
  const [sortMenuOpen, setSortMenuOpen] = useState(false)
  const sortMenuRef = useRef<HTMLDivElement>(null)
  const fetchIdRef = useRef(0)

  const fetchPage = useCallback(async (sort: FavoriteSort, offset: number) => {
    const id = ++fetchIdRef.current
    const isFirst = offset === 0
    if (isFirst) setLoading(true)
    else setLoadingMore(true)

    try {
      const data = await favoriteService.list({ sortBy: sort, offset, limit: PAGE_SIZE })
      if (id !== fetchIdRef.current) return
      if (isFirst) {
        setItems(data.items)
      } else {
        setItems((prev) => [...prev, ...data.items])
      }
      setTotal(data.total)
      setHasMore(data.hasMore)
    } catch {
      if (id === fetchIdRef.current && isFirst) {
        setItems([])
        setTotal(0)
        setHasMore(false)
      }
    } finally {
      if (id === fetchIdRef.current) {
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }, [])

  useEffect(() => {
    void fetchPage(sortBy, 0)
  }, [sortBy, fetchPage])

  useEffect(() => {
    if (!sortMenuOpen) return
    const handlePointerDown = (e: MouseEvent) => {
      if (!sortMenuRef.current?.contains(e.target as Node)) setSortMenuOpen(false)
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSortMenuOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [sortMenuOpen])

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return
    void fetchPage(sortBy, items.length)
  }

  const handleToggle = async (tourId: number) => {
    await toggleFavorite(tourId)
    setItems((prev) => prev.filter((f) => f.tourId !== tourId))
    setTotal((prev) => Math.max(0, prev - 1))
  }

  const selectedSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? SORT_OPTIONS[0].label

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-4">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ทัวร์ที่ถูกใจ</h1>
          <p className="mt-1 text-sm text-gray-500">
            {loading ? 'กำลังโหลด...' : `${total} ทัวร์ที่คุณกดถูกใจ`}
          </p>
        </div>

        <div ref={sortMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setSortMenuOpen((prev) => !prev)}
            className="ui-focus-ring inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-white"
            aria-haspopup="listbox"
            aria-expanded={sortMenuOpen}
          >
            <span>{selectedSortLabel}</span>
            <svg className={`h-4 w-4 text-gray-500 transition-transform ${sortMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {sortMenuOpen && (
            <div className="ui-pop animate-slide-up absolute right-0 top-[calc(100%+0.5rem)] z-20 min-w-[190px] rounded-[1.4rem] border border-gray-200 bg-white p-2 shadow-[0_20px_40px_rgba(15,23,42,0.14)]">
              <div role="listbox" aria-label="เรียงลำดับทัวร์ที่ถูกใจ" className="space-y-1">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setSortBy(option.value as FavoriteSort)
                      setSortMenuOpen(false)
                    }}
                    className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-md font-medium transition-colors ${
                      sortBy === option.value
                        ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span>{option.label}</span>
                    {sortBy === option.value && (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="ui-surface rounded-[1.5rem] px-6 py-20 text-center text-gray-400">กำลังโหลด...</div>
      ) : items.length === 0 ? (
        <div className="ui-surface rounded-[1.5rem] px-6 py-20 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-700">ยังไม่มีทัวร์ที่ถูกใจ</p>
          <p className="mt-2 text-sm text-gray-400">ลองกดหัวใจบนทัวร์ที่คุณสนใจเพื่อบันทึกไว้ดูภายหลัง</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((fav) => (
              <TourCard
                key={fav.id}
                tour={fav.tour}
                isFavorite={isFavorite(fav.tourId)}
                isInactive={!fav.tour.isActive}
                onToggleFavorite={() => void handleToggle(fav.tourId)}
              />
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="ui-focus-ring ui-pressable inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                {loadingMore ? 'กำลังโหลด...' : 'โหลดเพิ่มเติม'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
