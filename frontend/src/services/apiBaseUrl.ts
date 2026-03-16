function getDefaultApiBaseUrl() {
  if (typeof window === 'undefined') {
    return 'http://localhost:3000'
  }

  const protocol = window.location.protocol
  const hostname = window.location.hostname || 'localhost'
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'

  if (isLocalhost) {
    return `${protocol}//${hostname}:3000`
  }

  return `${window.location.origin}/api`
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

export const API_BASE_URL = trimTrailingSlash(import.meta.env.VITE_API_URL || getDefaultApiBaseUrl())
