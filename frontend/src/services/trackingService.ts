import api, { getAccessToken } from './api'

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

const TRACKING_CONSENT_KEY = 'pdpa_analytics_consent'
const TRACKING_SESSION_KEY = 'tracking_session_id'
const TRACKING_ENABLED = import.meta.env.VITE_TRACKING_ENABLED !== 'false'
const TRACKING_ENDPOINT = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/analytics/events`

// หมายเหตุ PDPA: ระบบจะส่งข้อมูลพฤติกรรมก็ต่อเมื่อผู้ใช้ให้ consent แล้วเท่านั้น
export function hasTrackingConsent(): boolean {
  return localStorage.getItem(TRACKING_CONSENT_KEY) === 'granted'
}

export function setTrackingConsent(granted: boolean) {
  localStorage.setItem(TRACKING_CONSENT_KEY, granted ? 'granted' : 'denied')
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
  if (!TRACKING_ENABLED || !hasTrackingConsent()) return

  const body: TrackingPayload = {
    ...payload,
    sessionId: getTrackingSessionId(),
    occurredAt: new Date().toISOString(),
  }
  await api.post('/analytics/events', body).catch(() => undefined)
}

// สำหรับ event ตอนออกจากหน้า ใช้ keepalive เพื่อลดโอกาส request หล่น
export function trackEventKeepalive(
  payload: Omit<TrackingPayload, 'sessionId' | 'occurredAt'>,
) {
  if (!TRACKING_ENABLED || !hasTrackingConsent()) return

  const body: TrackingPayload = {
    ...payload,
    sessionId: getTrackingSessionId(),
    occurredAt: new Date().toISOString(),
  }
  const token = getAccessToken()

  fetch(TRACKING_ENDPOINT, {
    method: 'POST',
    credentials: 'include',
    keepalive: true,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  }).catch(() => undefined)
}
