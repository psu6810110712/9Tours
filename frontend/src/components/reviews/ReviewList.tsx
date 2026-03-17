import { useEffect, useState } from 'react'
import { reviewService } from '../../services/reviewService'
import type { Review } from '../../types/review'
import StarRating from './StarRating'

const PAGE_SIZE = 10

interface ReviewListProps {
  tourId: number
}

function getDisplayName(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0]
  const last = parts[parts.length - 1]
  return `${parts[0]} ${last.charAt(0)}.`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function ReviewList({ tourId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setReviews([])

    reviewService.getReviews(tourId, PAGE_SIZE, 0)
      .then(({ data, total: t }) => {
        if (!cancelled) {
          setReviews(data)
          setTotal(t)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [tourId])

  const handleLoadMore = async () => {
    setLoadingMore(true)
    try {
      const { data } = await reviewService.getReviews(tourId, PAGE_SIZE, reviews.length)
      setReviews((prev) => [...prev, ...data])
    } catch {
      // silent
    } finally {
      setLoadingMore(false)
    }
  }

  const hasMore = reviews.length < total

  return (
    <section className="ui-surface mb-5 rounded-[1.5rem] border border-gray-100 bg-white p-6">
      <h2 className="mb-1 text-lg font-bold text-gray-900">รีวิวจากผู้เดินทาง</h2>
      <p className="mb-5 text-sm font-medium text-gray-400">{total} รีวิว</p>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl bg-gray-50 p-4">
              <div className="mb-2 h-4 w-1/4 rounded bg-gray-200" />
              <div className="h-3 w-full rounded bg-gray-200" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center">
          <p className="text-sm font-medium text-gray-400">ยังไม่มีรีวิว เป็นคนแรกที่รีวิวทัวร์นี้!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {review.user?.name?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>
                  <span className="text-sm font-semibold text-gray-800">
                    {review.user?.name ? getDisplayName(review.user.name) : 'ผู้ใช้งาน'}
                  </span>
                </div>
                <span className="text-xs font-medium text-gray-400">{formatDate(review.createdAt)}</span>
              </div>

              <div className="mt-2">
                <StarRating value={review.rating} readonly size="sm" />
              </div>

              <p className="mt-2 text-sm leading-6 text-gray-700 whitespace-pre-line">{review.comment}</p>
            </div>
          ))}

          {hasMore && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="ui-focus-ring rounded-full border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {loadingMore ? 'กำลังโหลด...' : 'โหลดเพิ่มเติม'}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
