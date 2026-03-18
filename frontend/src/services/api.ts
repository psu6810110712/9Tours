import axios, { type InternalAxiosRequestConfig } from 'axios'
import type { User } from '../types/user'
import { API_BASE_URL } from './apiBaseUrl'

const baseURL = API_BASE_URL

export interface SessionRefreshResponse {
  user: User
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

interface RefreshRequestOptions {
  emitAuthExpired?: boolean
}

const api = axios.create({
  baseURL,
  withCredentials: true,
})

let refreshPromise: Promise<SessionRefreshResponse> | null = null
let shouldEmitAuthExpiredOnRefreshFailure = false

export const requestSessionRefresh = async (options: RefreshRequestOptions = {}) => {
  if (options.emitAuthExpired) {
    shouldEmitAuthExpiredOnRefreshFailure = true
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post<SessionRefreshResponse>(`${baseURL}/auth/refresh`, undefined, { withCredentials: true })
      .then((response) => {
        return response.data
      })
      .catch((error) => {
        if (shouldEmitAuthExpiredOnRefreshFailure) {
          window.dispatchEvent(new CustomEvent('auth:expired'))
        }
        throw error
      })
      .finally(() => {
        refreshPromise = null
        shouldEmitAuthExpiredOnRefreshFailure = false
      })
  }

  return refreshPromise
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error.config as RetryableRequestConfig | undefined
    if (error.response?.status !== 401 || !originalConfig) {
      return Promise.reject(error)
    }

    const url = originalConfig.url || ''
    const isAuthLifecycleRequest = (
      url.includes('/auth/login')
      || url.includes('/auth/register')
      || url.includes('/auth/refresh')
      || url.includes('/auth/logout')
    )

    if (isAuthLifecycleRequest || originalConfig._retry) {
      return Promise.reject(error)
    }

    try {
      originalConfig._retry = true
      await requestSessionRefresh({ emitAuthExpired: true })
      return api(originalConfig)
    } catch (refreshError) {
      return Promise.reject(refreshError)
    }
  }
)

export default api
