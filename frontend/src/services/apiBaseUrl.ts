function getDefaultApiBaseUrl() {
  if (typeof window === 'undefined') {
    return 'http://localhost:3000'
  }

  const protocol = window.location.protocol
  const hostname = window.location.hostname || 'localhost'
  return `${protocol}//${hostname}:3000`
}

export const API_BASE_URL = import.meta.env.VITE_API_URL || getDefaultApiBaseUrl()
