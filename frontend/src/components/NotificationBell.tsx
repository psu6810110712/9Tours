import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { notificationService } from '../services/notificationService'
import type { Notification } from '../types/notification'

const POLL_INTERVAL = 30_000

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'เมื่อสักครู่'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`
  const days = Math.floor(hours / 24)
  return `${days} วันที่แล้ว`
}

function typeIcon(type: Notification['type']) {
  switch (type) {
    case 'booking_confirmed':
      return (
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m9 12 2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </span>
      )
    case 'booking_success':
      return (
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </span>
      )
    case 'booking_canceled':
      return (
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </span>
      )
  }
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount()
      setUnreadCount(count)
    } catch {
      // silently ignore
    }
  }, [])

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const data = await notificationService.getNotifications()
      setNotifications(data)
      setUnreadCount(data.filter((n) => !n.isRead).length)
    } catch {
      // silently ignore
    } finally {
      setLoading(false)
    }
  }, [])

  // Poll for unread count
  useEffect(() => {
    void fetchUnreadCount()
    const interval = setInterval(() => void fetchUnreadCount(), POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  // Load full list when opened
  useEffect(() => {
    if (open) {
      void fetchNotifications()
    }
  }, [open, fetchNotifications])

  // Click-away close
  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {
      // silently ignore
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await notificationService.markAsRead(notification.id)
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch {
        // silently ignore
      }
    }
    setOpen(false)
    navigate('/my-bookings')
  }

  return (
    <div className="relative hidden md:block" ref={containerRef}>
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-label="การแจ้งเตือน"
        className="ui-focus-ring ui-pressable relative flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-gray-500 transition-colors hover:border-gray-200 hover:bg-gray-50 hover:text-gray-700"
      >
        <svg className="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="ui-surface ui-pop absolute right-0 z-[48] mt-3 w-[360px] overflow-hidden border border-gray-100 bg-white">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-800">การแจ้งเตือน</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-dark)]"
              >
                อ่านทั้งหมด
              </button>
            )}
          </div>

          {/* Content */}
          <div className="max-h-[380px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-[var(--color-primary)]" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <svg className="mb-2 h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                </svg>
                <p className="text-sm text-gray-400">ไม่มีการแจ้งเตือน</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => void handleNotificationClick(notification)}
                  className={`flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 ${
                    !notification.isRead ? 'border-l-[3px] border-l-[var(--color-primary)] bg-blue-50/40' : ''
                  }`}
                >
                  {typeIcon(notification.type)}
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm leading-snug ${!notification.isRead ? 'font-semibold text-gray-800' : 'text-gray-700'}`}>
                      {notification.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-500 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-[11px] text-gray-400">
                      {timeAgo(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[var(--color-primary)]" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
