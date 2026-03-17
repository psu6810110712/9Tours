import api from './api'
import { API_BASE_URL } from './apiBaseUrl'

export type TrackingEventType = 'page_view' | 'cta_click' | 'dwell_time'

interface TrackingPayload {
  eventType: TrackingEventType
  pagePath: string
  sessionId: string
  tourId?: number
  elementId?: string
  dwellMs?: number
  occurredAt?: string
  metadata?: Record<string, unknown>
}

const TRACKING_SESSION_KEY = 'tracking_session_id'
const ANONYMOUS_ID_KEY = 'anonymous_id'
const TRACKING_ENABLED = import.meta.env.VITE_TRACKING_ENABLED !== 'false'
const TRACKING_ENDPOINT = `${API_BASE_URL}/analytics/events`

export function getAnonymousId(): string {
  const existing = localStorage.getItem(ANONYMOUS_ID_KEY)
  if (existing) return existing
  const generated = `anon_${crypto.randomUUID().replace(/-/g, '')}`
  localStorage.setItem(ANONYMOUS_ID_KEY, generated)
  return generated
}

export function getTrackingSessionId(): string {
  const existing = localStorage.getItem(TRACKING_SESSION_KEY)
  if (existing) return existing
  const generated = `sid_${crypto.randomUUID().replace(/-/g, '')}`
  localStorage.setItem(TRACKING_SESSION_KEY, generated)
  return generated
}

export async function trackEvent(
  payload: Omit<TrackingPayload, 'sessionId' | 'occurredAt'>,
) {
  if (!TRACKING_ENABLED) return

  const body: TrackingPayload = {
    ...payload,
    sessionId: getTrackingSessionId(),
    occurredAt: new Date().toISOString(),
  }
  await api.post('/analytics/events', body, {
    headers: {
      'x-anonymous-id': getAnonymousId(),
    },
  }).catch(() => undefined)
}

// สำหรับ event ตอนออกจากหน้า ใช้ keepalive เพื่อลดโอกาส request หล่น
export function trackEventKeepalive(
  payload: Omit<TrackingPayload, 'sessionId' | 'occurredAt'>,
) {
  if (!TRACKING_ENABLED) return

  const body: TrackingPayload = {
    ...payload,
    sessionId: getTrackingSessionId(),
    occurredAt: new Date().toISOString(),
  }

  fetch(TRACKING_ENDPOINT, {
    method: 'POST',
    credentials: 'include',
    keepalive: true,
    headers: {
      'Content-Type': 'application/json',
      'x-anonymous-id': getAnonymousId(),
    },
    body: JSON.stringify(body),
  }).catch(() => undefined)
}
