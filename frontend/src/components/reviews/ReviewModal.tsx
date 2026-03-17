import { useState } from 'react'
import { toast } from 'react-hot-toast'
import Modal from '../common/Modal'
import StarRating from './StarRating'
import { reviewService } from '../../services/reviewService'

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  bookingId: number
  tourName: string
  onSuccess: () => void
}

export default function ReviewModal({ isOpen, onClose, bookingId, tourName, onSuccess }: ReviewModalProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleClose = () => {
    if (submitting) return
    setRating(0)
    setComment('')
    onClose()
  }

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('กรุณาเลือกคะแนนดาว')
      return
    }
    if (!comment.trim()) {
      toast.error('กรุณาเขียนความคิดเห็น')
      return
    }

    try {
      setSubmitting(true)
      await reviewService.submitReview(bookingId, rating, comment.trim())
      toast.success('ขอบคุณสำหรับรีวิวของคุณ!')
      setRating(0)
      setComment('')
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} width="max-w-lg">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">เขียนรีวิว</h3>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="ui-focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
            aria-label="ปิด"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm font-semibold text-gray-600 line-clamp-2">{tourName}</p>

        <div>
          <p className="mb-2 text-sm font-semibold text-gray-700">คะแนนความพึงพอใจ</p>
          <StarRating value={rating} onChange={setRating} size="lg" />
          {rating > 0 && (
            <p className="mt-1.5 text-xs font-medium text-amber-600">
              {['', 'แย่มาก', 'พอใช้', 'ดี', 'ดีมาก', 'ยอดเยี่ยม'][rating]}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            ความคิดเห็น
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="เล่าประสบการณ์การท่องเที่ยวของคุณ..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white resize-none"
          />
          <p className="mt-1 text-right text-xs text-gray-400">{comment.length}/2000</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="ui-focus-ring flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="ui-focus-ring flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {submitting ? 'กำลังส่ง...' : 'ส่งรีวิว'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
